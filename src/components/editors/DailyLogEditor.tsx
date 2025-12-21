
import { useState, useEffect } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export function DailyLogEditor() {
    const { dailyLogs, upsertDailyLog, selectedProjectId } = useProjectStore();
    const [date, setDate] = useState<Date>(new Date());
    const [loading, setLoading] = useState(false);

    // Form State
    const [workedOn, setWorkedOn] = useState("");
    const [completed, setCompleted] = useState("");
    const [notCompleted, setNotCompleted] = useState("");
    const [blockers, setBlockers] = useState("");
    const [isEdit, setIsEdit] = useState(false);

    // Load existing log if any when date changes
    useEffect(() => {
        if (!selectedProjectId) return;
        const dateStr = format(date, 'yyyy-MM-dd');
        const existing = dailyLogs.find(l => l.log_date === dateStr);

        if (existing) {
            setWorkedOn(existing.worked_today.join('\n'));
            setCompleted(existing.completed_today.join('\n'));
            setNotCompleted(existing.not_completed.join('\n'));
            setBlockers(existing.blockers.join('\n'));
            setIsEdit(true);
        } else {
            setWorkedOn("");
            setCompleted("");
            setNotCompleted("");
            setBlockers("");
            setIsEdit(false);
        }
    }, [date, dailyLogs, selectedProjectId]);

    const handleSave = async () => {
        if (!selectedProjectId) return;
        setLoading(true);
        try {
            await upsertDailyLog({
                log_date: format(date, 'yyyy-MM-dd'),
                project_id: selectedProjectId,
                worked_today: workedOn.split('\n').filter(s => s.trim()),
                completed_today: completed.split('\n').filter(s => s.trim()),
                not_completed: notCompleted.split('\n').filter(s => s.trim()),
                blockers: blockers.split('\n').filter(s => s.trim())
            });
            toast.success("Daily log saved successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to save daily log");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Log Date:</span>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[200px] pl-3 text-left font-normal">
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(d) => d && setDate(d)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <Button onClick={handleSave} disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isEdit ? "Update Log" : "Save Log"}
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-blue-500">Worked On Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="- Feature X implementation..."
                            className="min-h-[150px] font-mono text-sm"
                            value={workedOn}
                            onChange={(e) => setWorkedOn(e.target.value)}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-green-500">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="- Fixed bug Y..."
                            className="min-h-[150px] font-mono text-sm"
                            value={completed}
                            onChange={(e) => setCompleted(e.target.value)}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-orange-500">Not Completed / Tomorrow</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="- Refactor Z..."
                            className="min-h-[150px] font-mono text-sm"
                            value={notCompleted}
                            onChange={(e) => setNotCompleted(e.target.value)}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-red-500">Blockers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="- Waiting for API..."
                            className="min-h-[150px] font-mono text-sm"
                            value={blockers}
                            onChange={(e) => setBlockers(e.target.value)}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
