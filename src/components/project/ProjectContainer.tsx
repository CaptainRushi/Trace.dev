import { useState } from 'react';
import { TerminalTabs } from '@/components/tabs/TerminalTabs';
import { ProjectOverview } from './ProjectOverview';
import { DailyLogEditor } from '@/components/editors/DailyLogEditor';
import { APIKeyVault } from '@/components/vault/APIKeyVault';
import { DatabaseEditor } from '@/components/editors/DatabaseEditor';
import { ContributionGraph } from '@/components/charts/ContributionGraph';
import { ImprovementsBoard } from '@/components/boards/ImprovementsBoard';

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

  const renderContent = () => {
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
      <TerminalTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 pt-4 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}
