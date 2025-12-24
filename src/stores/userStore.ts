
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserProfile {
    id: string;
    email: string;
    username?: string;
    avatar_url?: string;
    bio?: string;
    created_at: string;
}

interface UserStore {
    profile: UserProfile | null;
    loading: boolean;

    fetchUser: () => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    uploadAvatar: (file: File) => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
    profile: null,
    loading: false,

    fetchUser: async () => {
        set({ loading: true });
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            set({ loading: false });
            return;
        }

        const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (error) {
            console.error("Error fetching profile", error);
        }

        if (!profile && user) {
            // Profile missing? Create it manually (fallback if trigger failed)
            console.log("Profile missing for auth user, creating...");
            const { data: newProfile, error: createError } = await supabase
                .from('users')
                .insert({ id: user.id, email: user.email })
                .select()
                .single();

            if (createError) {
                console.error("Failed to create missing profile:", createError);
            } else {
                set({ profile: newProfile as UserProfile, loading: false });
                return;
            }
        }

        set({
            profile: profile as UserProfile,
            loading: false
        });
    },

    updateProfile: async (updates) => {
        const { profile } = get();
        if (!profile) return;

        const { error } = await supabase.from('users').update(updates).eq('id', profile.id);
        if (error) {
            console.error("Profile update error:", error);
            if (error.code === '23505') {
                toast.error("Username already taken");
            } else {
                toast.error("Failed to update profile");
            }
            throw error;
        }
        set({ profile: { ...profile, ...updates } });
        toast.success("Profile updated");
    },

    uploadAvatar: async (file) => {
        const { profile } = get();
        if (!profile) return;

        if (file.size > 300 * 1024) {
            toast.error("Image must be under 300 KB");
            throw new Error("Image too large");
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${profile.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, { upsert: true });

        if (uploadError) {
            console.error("Avatar upload error:", uploadError);
            toast.error("Upload failed");
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        const urlWithCtx = `${publicUrl}?t=${Date.now()}`;

        await get().updateProfile({ avatar_url: urlWithCtx });
    }
}));
