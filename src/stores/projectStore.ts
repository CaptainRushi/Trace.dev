import { create } from 'zustand';

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'archived';
  lastActivity: string;
  streak: number;
  description?: string;
}

export interface DailyLog {
  id: string;
  projectId: string;
  date: string;
  workedOn: string;
  completed: string;
  notCompleted: string;
  blockers: string;
}

export interface APIKeyPacket {
  id: string;
  projectId: string;
  platform: string;
  environment: 'development' | 'staging' | 'production';
  keyName: string;
  maskedKey: string;
}

export interface Improvement {
  id: string;
  projectId: string;
  text: string;
  category: 'improve' | 'tomorrow' | 'stop';
}

interface ProjectStore {
  projects: Project[];
  selectedProjectId: string | null;
  dailyLogs: DailyLog[];
  apiKeys: APIKeyPacket[];
  improvements: Improvement[];
  contributions: Record<string, number>;
  
  setSelectedProject: (id: string | null) => void;
  addProject: (project: Project) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [
    {
      id: '1',
      name: 'devtrack-cli',
      status: 'active',
      lastActivity: '2024-01-15',
      streak: 12,
      description: 'CLI tool for tracking development progress',
    },
    {
      id: '2',
      name: 'api-gateway',
      status: 'active',
      lastActivity: '2024-01-14',
      streak: 5,
      description: 'Microservices API gateway',
    },
    {
      id: '3',
      name: 'auth-service',
      status: 'paused',
      lastActivity: '2024-01-10',
      streak: 0,
      description: 'Authentication microservice',
    },
  ],
  selectedProjectId: null,
  dailyLogs: [],
  apiKeys: [
    {
      id: '1',
      projectId: '1',
      platform: 'GitHub',
      environment: 'production',
      keyName: 'GITHUB_TOKEN',
      maskedKey: 'ghp_****************************',
    },
    {
      id: '2',
      projectId: '1',
      platform: 'Vercel',
      environment: 'production',
      keyName: 'VERCEL_TOKEN',
      maskedKey: 'vercel_****************************',
    },
    {
      id: '3',
      projectId: '1',
      platform: 'OpenAI',
      environment: 'development',
      keyName: 'OPENAI_API_KEY',
      maskedKey: 'sk-****************************',
    },
  ],
  improvements: [
    { id: '1', projectId: '1', text: 'Add better error handling', category: 'improve' },
    { id: '2', projectId: '1', text: 'Write unit tests', category: 'tomorrow' },
    { id: '3', projectId: '1', text: 'Stop hardcoding values', category: 'stop' },
  ],
  contributions: {},

  setSelectedProject: (id) => set({ selectedProjectId: id }),
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
}));
