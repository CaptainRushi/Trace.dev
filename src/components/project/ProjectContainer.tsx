
import { useState, useEffect } from 'react';
import { TerminalTabs } from '@/components/tabs/TerminalTabs';
import { ProjectOverview } from './ProjectOverview';
import { DailyLogEditor } from '@/components/editors/DailyLogEditor';
import { APIKeyVault } from '../vault/APIKeyVault';
import { CodeVault } from '../vault/CodeVault';
import { DatabaseEditor } from '@/components/editors/DatabaseEditor';
import { TaskHeatmap } from '@/components/charts/TaskHeatmap';
import { ImprovementsBoard } from '@/components/boards/ImprovementsBoard';
import { TraceDraw } from '@/components/tracedraw/TraceDraw';
import { LockedFeature } from '@/components/billing/LockedFeature';
import { useProjectStore } from '@/stores/projectStore';
import { usePlanStore } from '@/stores/planStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'daily-log', label: 'Daily Log' },
  { id: 'code-vault', label: 'Code Vault', locked: 'database' as const },
  { id: 'api-keys', label: 'API Keys' },
  { id: 'database', label: 'Database', locked: 'database' as const },
  { id: 'tracedraw', label: 'TraceDraw', locked: 'tracedraw' as const },
  { id: 'tasks', label: 'Daily Tasks' },
  { id: 'improvements', label: 'Improvements' },
];

export function ProjectContainer() {
  const [activeTab, setActiveTab] = useState('overview');
  const { selectedProjectId, fetchProjectDetails, setSelectedProject, loading } = useProjectStore();
  const { features } = usePlanStore();

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetails(selectedProjectId);
    }
  }, [selectedProjectId, fetchProjectDetails]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return <ProjectOverview />;
      case 'daily-log':
        return <DailyLogEditor />;
      case 'code-vault':
        return (
          <LockedFeature feature="database">
            <CodeVault />
          </LockedFeature>
        );
      case 'api-keys':
        return <APIKeyVault />;
      case 'database':
        return (
          <LockedFeature feature="database">
            <DatabaseEditor />
          </LockedFeature>
        );
      case 'tracedraw':
        return (
          <LockedFeature feature="tracedraw">
            <TraceDraw />
          </LockedFeature>
        );
      case 'tasks':
        return <TaskHeatmap />;
      case 'improvements':
        return <ImprovementsBoard />;
      default:
        return <ProjectOverview />;
    }
  };

  // Get tab configuration with locked states
  const getTabsWithLockState = () => {
    return tabs.map(tab => ({
      id: tab.id,
      label: tab.label,
      locked: tab.locked,
      isLocked: tab.locked === 'database'
        ? !features.databaseAccess
        : tab.locked === 'tracedraw'
          ? !features.traceDrawAccess
          : false
    }));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center mb-2">
        <Button variant="ghost" size="sm" onClick={() => setSelectedProject(null)} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <TerminalTabs
          tabs={getTabsWithLockState()}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <div className="flex-1 pt-4 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}
