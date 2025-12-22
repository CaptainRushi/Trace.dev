
import { useState, useEffect } from "react";
import { useUserStore } from "@/stores/userStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Upload, User, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function EditProfileDialog() {
    const { profile, updateProfile, uploadAvatar } = useUserStore();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Validation State
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [isUsernameAvailable, setIsUsernameAvailable] = useState(true);

    useEffect(() => {
        if (open && profile) {
            setUsername(profile.username || "");
            setBio(profile.bio || "");
            setPreviewUrl(profile.avatar_url || null);
            setFile(null);
            setUsernameError(null);
        }
    }, [open, profile]);

    // Checks
    useEffect(() => {
        const checkUsername = async () => {
            if (!username || username === profile?.username) {
                setUsernameError(null);
                setIsUsernameAvailable(true);
                return;
            }
            if (username.length < 3) {
                setUsernameError("Min 3 characters");
                setIsUsernameAvailable(false);
                return;
            }
            if (!/^[a-z0-9_]+$/.test(username)) {
                setUsernameError("Lowercase letters, numbers, underscore only");
                setIsUsernameAvailable(false);
                return;
            }

            setCheckingUsername(true);
            const { count, error } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('username', username);

            setCheckingUsername(false);

            if (error) {
                console.error(error);
                return;
            }

            if (count && count > 0) {
                setUsernameError("Username already taken");
                setIsUsernameAvailable(false);
            } else {
                setUsernameError(null);
                setIsUsernameAvailable(true);
            }
        };

        const timer = setTimeout(checkUsername, 500);
        return () => clearTimeout(timer);
    }, [username, profile]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;

        if (f.size > 300 * 1024) {
            toast.error("Image must be under 300 KB");
            // clear input
            e.target.value = "";
            return;
        }

        setFile(f);
        setPreviewUrl(URL.createObjectURL(f));
    };

    const handleSave = async () => {
        if (!isUsernameAvailable || usernameError) return;

        setLoading(true);
        try {
            // Only update if changed
            if (username !== profile?.username || bio !== profile?.bio) {
                await updateProfile({ username, bio });
            }
            if (file) {
                await uploadAvatar(file);
            }
            setOpen(false);
        } catch (e) {
            // Toast handled in store usually
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>Update your public identity.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="w-24 h-24 border-2 border-border">
                            <AvatarImage src={previewUrl || ""} className="object-cover" />
                            <AvatarFallback><User className="w-12 h-12" /></AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                            <Input
                                id="avatar-upload"
                                type="file"
                                className="hidden"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleFileSelect}
                            />
                            <Button variant="outline" size="sm" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                <Upload className="w-4 h-4 mr-2" /> Change Avatar
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Max 300KB. Square. JPG/PNG/WEBP.</p>
                    </div>

                    {/* Username */}
                    <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <div className="relative">
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={usernameError ? "border-red-500 pr-10" : "pr-10"}
                                placeholder="unique_username"
                            />
                            <div className="absolute right-3 top-2.5">
                                {checkingUsername ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> :
                                    usernameError ? <AlertCircle className="w-4 h-4 text-red-500" /> :
                                        (username && username !== profile?.username && isUsernameAvailable) ? <Check className="w-4 h-4 text-green-500" /> : null}
                            </div>
                        </div>
                        {usernameError && <p className="text-[10px] text-red-500">{usernameError}</p>}
                    </div>

                    {/* Bio */}
                    <div className="grid gap-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value.slice(0, 200))}
                            className="resize-none"
                            rows={3}
                            placeholder="Tell us about yourself..."
                        />
                        <p className="text-[10px] text-right text-muted-foreground">{bio.length}/200</p>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading || !!usernameError || !isUsernameAvailable}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
