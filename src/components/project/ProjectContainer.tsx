
import { useState, useEffect } from 'react';
import { TerminalTabs } from '@/components/tabs/TerminalTabs';
import { ProjectOverview } from './ProjectOverview';
import { DailyLogEditor } from '@/components/editors/DailyLogEditor';
import { APIKeyVault } from '../vault/APIKeyVault';
import { DatabaseEditor } from '@/components/editors/DatabaseEditor';
import { ContributionGraph } from '@/components/charts/ContributionGraph';
import { ImprovementsBoard } from '@/components/boards/ImprovementsBoard';
import { useProjectStore } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'daily-log', label: 'Daily Log' },
  { id: 'api-keys', label: 'API Keys' },
  { id: 'database', label: 'Database' },
  { id: 'contributions', label: 'Contributions' },
  { id: 'improvements', label: 'Improvements' },
];

export function ProjectContainer() {
  const [activeTab, setActiveTab] = useState('overview');
  const { selectedProjectId, fetchProjectDetails, setSelectedProject, loading } = useProjectStore();

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
      case 'api-keys':
        return <APIKeyVault />;
      case 'database':
        return <DatabaseEditor />;
      case 'contributions':
        return <ContributionGraph />;
      case 'improvements':
        return <ImprovementsBoard />;
      default:
        return <ProjectOverview />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center mb-2">
        <Button variant="ghost" size="sm" onClick={() => setSelectedProject(null)} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <TerminalTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="flex-1 pt-4 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}
