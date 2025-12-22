import { AppLayout } from '@/components/layout/AppLayout';
import Dashboard from './Dashboard';
import { ProjectContainer } from '@/components/project/ProjectContainer';
import { useProjectStore } from '@/stores/projectStore';

const Index = () => {
  const { selectedProjectId } = useProjectStore();

  return (
    <AppLayout>
      {selectedProjectId ? <ProjectContainer /> : <Dashboard />}
    </AppLayout>
  );
};

export default Index;
