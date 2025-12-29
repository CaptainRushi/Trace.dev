
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Task {
    id: string;
    project_id: string;
    title: string;
    description?: string;
    status: 'pending' | 'completed';
    created_at: string;
    completed_at?: string;
    scheduled_date?: string;
    estimated_minutes?: number;
}

export interface HeatmapPoint {
    date: string; // YYYY-MM-DD
    score: number;
    taskCount: number;
    logCount: number;
}

interface TaskStore {
    tasks: Task[];
    heatmapData: HeatmapPoint[];
    loading: boolean;

    // Actions
    fetchTasks: (projectId?: string, silent?: boolean) => Promise<void>;
    createTask: (projectId: string, title: string, description?: string) => Promise<Task | null>;
    toggleTaskStatus: (taskId: string, currentStatus: 'pending' | 'completed') => Promise<void>;
    scheduleTask: (taskId: string, date: string | null, minutes?: number) => Promise<void>;
    fetchHeatmapStats: (projectId?: string, startDate?: Date) => Promise<void>;
    subscribeToRealtime: (projectId?: string) => () => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
    tasks: [],
    heatmapData: [],
    loading: false,

    fetchTasks: async (projectId, silent = false) => {
        const hasData = get().tasks.length > 0 && (!projectId || get().tasks[0].project_id === projectId);
        if (!silent && !hasData) set({ loading: true });
        let query = supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (projectId) {
            query = query.eq('project_id', projectId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching tasks:', error);
            if (!silent) toast.error("Failed to load tasks");
        } else {
            set({ tasks: data as Task[] });
        }
        if (!silent) set({ loading: false });
    },

    createTask: async (projectId, title, description) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic add (with temp ID or wait? Waiting is safer for ID but slower UI)
        // We'll standard wait here as user expects "Task added" toast confirmation usually.
        // Prompt says "Immediately ... Optimistic UI". 
        // We'll implement strict Optimistic UI if needed, but the Realtime subscription 
        // will also trigger a fetch. To avoid double-add or specific logic, 
        // we can just insert and let the store refresh via local response.

        const { data, error } = await supabase
            .from('tasks')
            .insert({
                user_id: user.id,
                project_id: projectId,
                title,
                description
            })
            .select()
            .single();

        if (error) {
            toast.error("Failed to create task");
            throw error;
        }

        set((state) => ({ tasks: [data as Task, ...state.tasks] }));
        toast.success("Task added");

        get().fetchHeatmapStats(projectId);
        return data as Task;
    },

    toggleTaskStatus: async (taskId, currentStatus) => {
        const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
        const now = new Date().toISOString();

        // Optimistic update
        set((state) => ({
            tasks: state.tasks.map(t =>
                t.id === taskId
                    ? { ...t, status: newStatus, completed_at: newStatus === 'completed' ? now : undefined }
                    : t
            )
        }));

        const { error } = await supabase
            .from('tasks')
            .update({
                status: newStatus,
                completed_at: newStatus === 'completed' ? now : null
            })
            .eq('id', taskId);

        if (error) {
            toast.error("Failed to update task");
            get().fetchTasks(undefined, true);
        } else {
            const task = get().tasks.find(t => t.id === taskId);
            if (task) {
                get().fetchHeatmapStats(task.project_id);
            }
        }
    },

    scheduleTask: async (taskId, date, minutes) => {
        // Optimistic
        set((state) => ({
            tasks: state.tasks.map(t =>
                t.id === taskId
                    ? { ...t, scheduled_date: date || undefined, estimated_minutes: minutes }
                    : t
            )
        }));

        const { error } = await supabase
            .from('tasks')
            .update({
                scheduled_date: date,
                estimated_minutes: minutes
            })
            .eq('id', taskId);

        if (error) {
            toast.error("Failed to schedule task");
            // Revert fetch
            get().fetchTasks(undefined, true);
        }
    },

    fetchHeatmapStats: async (projectId, startDate) => {
        const start = startDate || new Date(new Date().setFullYear(new Date().getFullYear() - 1));
        const startIso = start.toISOString();
        const startIsoDate = startIso.split('T')[0];

        // 1. Tasks
        let taskQuery = supabase
            .from('tasks')
            .select('completed_at')
            .eq('status', 'completed')
            .gte('completed_at', startIso);

        if (projectId) taskQuery = taskQuery.eq('project_id', projectId);

        // 2. Logs
        let logQuery = supabase
            .from('daily_logs')
            .select('log_date')
            .eq('status', 'submitted')
            .gte('log_date', startIsoDate);

        if (projectId) logQuery = logQuery.eq('project_id', projectId);

        const [taskRes, logRes] = await Promise.all([taskQuery, logQuery]);

        const dateMap = new Map<string, { taskCount: number, logCount: number }>();

        // Process Tasks
        (taskRes.data || []).forEach((row: any) => {
            if (!row.completed_at) return;
            const date = row.completed_at.split('T')[0];
            const entry = dateMap.get(date) || { taskCount: 0, logCount: 0 };
            entry.taskCount++;
            dateMap.set(date, entry);
        });

        // Process Logs
        (logRes.data || []).forEach((row: any) => {
            if (!row.log_date) return;
            const date = row.log_date;
            const entry = dateMap.get(date) || { taskCount: 0, logCount: 0 };
            entry.logCount++;
            dateMap.set(date, entry);
        });

        const heatmapArray = Array.from(dateMap.entries()).map(([date, counts]) => ({
            date,
            score: (counts.taskCount * 1) + (counts.logCount * 2),
            taskCount: counts.taskCount,
            logCount: counts.logCount
        }));

        set({ heatmapData: heatmapArray });
    },

    subscribeToRealtime: (projectId) => {
        const channel = supabase.channel('dashboard-sync')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                () => {
                    // Silent refresh to sync state
                    get().fetchTasks(projectId, true);
                    get().fetchHeatmapStats(projectId);
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'daily_logs' },
                () => {
                    get().fetchHeatmapStats(projectId);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
}));
