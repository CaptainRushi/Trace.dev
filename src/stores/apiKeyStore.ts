
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ApiKey {
    id: string;
    project_id: string;
    platform: string;
    name: string;
    created_at: string;
}

interface ApiKeyStore {
    keys: ApiKey[];
    loading: boolean;

    fetchKeys: (projectId: string) => Promise<void>;
    createKey: (projectId: string, platform: string, name: string, value: string) => Promise<void>;
    revealKey: (keyId: string) => Promise<string | null>;
    deleteKey: (keyId: string) => Promise<void>;
}

export const useApiKeyStore = create<ApiKeyStore>((set, get) => ({
    keys: [],
    loading: false,

    fetchKeys: async (projectId) => {
        set({ loading: true });
        const { data, error } = await supabase
            .from('api_keys')
            .select('id, project_id, platform, name, created_at')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Fetch Keys Error", error);
            set({ keys: [] });
        } else {
            set({ keys: data as ApiKey[] });
        }
        set({ loading: false });
    },

    createKey: async (projectId, platform, name, value) => {
        const { error } = await supabase.rpc('create_api_key', {
            p_project_id: projectId,
            p_platform: platform,
            p_name: name,
            p_value: value
        });

        if (error) {
            apiError(error);
            throw error;
        }
        toast.success("Credential stored securely");
        get().fetchKeys(projectId);
    },

    revealKey: async (keyId) => {
        const { data, error } = await supabase.rpc('reveal_api_key', {
            p_key_id: keyId
        });

        if (error) {
            console.error(error);
            toast.error("Failed to decrypt key");
            return null;
        }
        return data as string;
    },

    deleteKey: async (keyId) => {
        const { error } = await supabase.from('api_keys').delete().eq('id', keyId);
        if (error) {
            apiError(error);
            throw error;
        }
        toast.success("Key removed");
        const { keys } = get();
        set({ keys: keys.filter(k => k.id !== keyId) });
    }
}));

function apiError(e: any) {
    console.error(e);
    toast.error(e.message || "Operation failed");
}
