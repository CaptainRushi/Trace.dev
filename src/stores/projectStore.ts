
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  tech_stack?: string[];
  repo_url?: string;
  created_at?: string;
  // Derived or extra fields
  last_activity?: string;
  streak?: number;
}

export interface DailyLog {
  id: string;
  project_id: string;
  log_date: string;
  worked_today: string[];
  completed_today: string[];
  not_completed: string[];
  blockers: string[];
  created_at?: string;
}

export interface APIKeyPacket {
  id: string;
  project_id: string;
  platform_name: string;
  environment: 'dev' | 'prod';
  notes?: string;
  encrypted_payload?: string; // We usually don't need this in frontend store unless debugging
  // We might store a dummy "masked" value if needed, or just presence
}

export interface DatabaseDoc {
  id: string;
  project_id: string;
  db_type: string;
  schema_notes: string;
  migration_notes: string;
  table_notes: string;
  updated_at: string;
}

export interface ContributionStat {
  id: string;
  project_id: string;
  activity_date: string;
  activity_score: number;
}

export interface ImprovementEntry {
  id: string;
  project_id: string;
  category: 'improve' | 'tomorrow' | 'stop';
  content: string;
  created_at: string;
}

interface ProjectStore {
  projects: Project[];
  selectedProjectId: string | null;
  dailyLogs: DailyLog[];
  apiKeys: APIKeyPacket[];
  dbDocs: DatabaseDoc | null;
  stats: ContributionStat[];
  improvements: ImprovementEntry[];

  loading: boolean;

  setSelectedProject: (id: string | null) => void;

  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (name: string, repoUrl: string, techStack: string[]) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  fetchProjectDetails: (projectId: string) => Promise<void>;

  // Daily Logs
  upsertDailyLog: (log: Partial<DailyLog>) => Promise<void>;

  // API Keys
  fetchApiKeys: (projectId: string) => Promise<void>;
  createApiKey: (projectId: string, platform: string, env: 'dev' | 'prod', payload: string) => Promise<void>;
  deleteApiKey: (id: string) => Promise<void>;

  // DB Docs
  upsertDbDoc: (doc: Partial<DatabaseDoc>) => Promise<void>;

  // Improvements
  addImprovement: (projectId: string, category: 'improve' | 'tomorrow' | 'stop', content: string) => Promise<void>;
  deleteImprovement: (id: string) => Promise<void>;

  // Stats
  refreshStats: (projectId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  selectedProjectId: null,
  dailyLogs: [],
  apiKeys: [],
  dbDocs: null,
  stats: [],
  improvements: [],
  loading: false,

  setSelectedProject: (id) => {
    set({ selectedProjectId: id });
  },

  fetchProjects: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      set({ loading: false });
      return;
    }

    // Transform if necessary or use as is (matching interface)
    // Supabase returns snake_case, interface keys match those now (mostly).
    // Status enum needs to match.
    set({ projects: data as any[], loading: false });
  },

  createProject: async (name, repoUrl, techStack) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id, // RLS handles this but good to be explicit or let default handle IF default was auth.uid()
        name,
        repo_url: repoUrl,
        tech_stack: techStack
      })
      .select()
      .single();

    if (error) throw error;

    // Add to store
    set((state) => ({ projects: [data as any, ...state.projects] }));

    // Create Container
    await supabase.from('project_containers').insert({
      project_id: data.id,
      user_id: user.id
    });
  },

  deleteProject: async (id) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;

    set((state) => ({
      projects: state.projects.filter(p => p.id !== id),
      selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId
    }));
  },

  fetchProjectDetails: async (projectId) => {
    // Parallel fetch for a specific project
    set({ loading: true });

    const [logs, keys, docs, imp, st] = await Promise.all([
      supabase.from('daily_logs').select('*').eq('project_id', projectId).order('log_date', { ascending: false }),
      supabase.from('api_key_packets').select('*').eq('project_id', projectId),
      supabase.from('database_docs').select('*').eq('project_id', projectId).maybeSingle(),
      supabase.from('improvement_entries').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('contribution_stats').select('*').eq('project_id', projectId).order('activity_date', { ascending: true })
    ]);

    set({
      dailyLogs: logs.data as any[] || [],
      apiKeys: keys.data as any[] || [],
      dbDocs: docs.data as any || null,
      improvements: imp.data as any[] || [],
      stats: st.data as any[] || [],
      loading: false
    });
  },

  upsertDailyLog: async (log) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !get().selectedProjectId) return;

    const { data, error } = await supabase
      .from('daily_logs')
      .upsert({
        user_id: user.id,
        project_id: get().selectedProjectId,
        log_date: log.log_date || new Date().toISOString().split('T')[0],
        worked_today: log.worked_today,
        completed_today: log.completed_today,
        not_completed: log.not_completed,
        blockers: log.blockers
      }, { onConflict: 'project_id, log_date' })
      .select()
      .single();

    if (error) throw error;

    // Update local state
    set((state) => {
      const index = state.dailyLogs.findIndex(l => l.id === data.id);
      if (index >= 0) {
        const newLogs = [...state.dailyLogs];
        newLogs[index] = data as any;
        return { dailyLogs: newLogs };
      } else {
        return { dailyLogs: [data as any, ...state.dailyLogs] };
      }
    });
  },

  fetchApiKeys: async (projectId) => {
    // Already handled in fetchProjectDetails but can be standalone
    const { data } = await supabase.from('api_key_packets').select('*').eq('project_id', projectId);
    set({ apiKeys: data as any[] || [] });
  },

  createApiKey: async (projectId, platform, env, payload) => {
    // 1. Call Edge Function to encrypt
    const { data: envData, error: funcError } = await supabase.functions.invoke('encrypt-packet', {
      body: { payload }
    });
    if (funcError || !envData.encrypted_payload) throw funcError || new Error("Encryption failed");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 2. Insert into DB
    const { data, error } = await supabase
      .from('api_key_packets')
      .insert({
        user_id: user.id,
        project_id: projectId,
        platform_name: platform,
        environment: env,
        encrypted_payload: envData.encrypted_payload
      })
      .select()
      .single();

    if (error) throw error;

    set((state) => ({ apiKeys: [...state.apiKeys, data as any] }));
  },

  deleteApiKey: async (id) => {
    const { error } = await supabase.from('api_key_packets').delete().eq('id', id);
    if (error) throw error;
    set((state) => ({ apiKeys: state.apiKeys.filter(k => k.id !== id) }));
  },

  upsertDbDoc: async (doc) => {
    const { data: { user } } = await supabase.auth.getUser();
    const pid = get().selectedProjectId;
    if (!user || !pid) return;

    const { data, error } = await supabase
      .from('database_docs')
      .upsert({
        // If ID exists, it updates. If we only have 1 doc per project, strictly we should find ID or use a unique constraint, 
        // but schema only had unique(project_id) implicitly if we limit logic. Schema didn't enforce unique(project_id) for db_docs but it makes sense 1:1.
        // Logic check: "One database doc per project"?
        // I'll query existing first or assume ID passed if updating.
        ...(doc.id ? { id: doc.id } : {}),
        user_id: user.id,
        project_id: pid,
        db_type: doc.db_type || 'PostgreSQL',
        schema_notes: doc.schema_notes,
        migration_notes: doc.migration_notes,
        table_notes: doc.table_notes
      }) // Note: Without unique constraint on project_id, upsert without ID inserts new. 
      // I will check if one exists first in `fetchProjectDetails` and pass ID.
      .select()
      .single();

    if (error) throw error;
    set({ dbDocs: data as any });
  },

  addImprovement: async (projectId, category, content) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('improvement_entries')
      .insert({
        user_id: user.id,
        project_id: projectId,
        category,
        content
      })
      .select()
      .single();

    if (error) throw error;
    set((state) => ({ improvements: [data as any, ...state.improvements] }));
  },

  deleteImprovement: async (id) => {
    const { error } = await supabase.from('improvement_entries').delete().eq('id', id);
    if (error) throw error;
    set((state) => ({ improvements: state.improvements.filter(i => i.id !== id) }));
  },

  refreshStats: async (projectId) => {
    // Call Edge Function
    const { error } = await supabase.functions.invoke('calculate-stats', {
      body: { project_id: projectId } // optionally date
    });
    if (error) throw error;

    // Refresh local
    const { data } = await supabase.from('contribution_stats').select('*').eq('project_id', projectId).order('activity_date', { ascending: true });
    set({ stats: data as any[] || [] });
  }

}));
