import { useRoute } from 'wouter';
import { ProjectDashboard } from '@/components/dashboard/ProjectDashboard';

export function ProjectPage() {
  const [match, params] = useRoute('/project/:id');
  
  if (!match || !params?.id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Project not found</p>
      </div>
    );
  }

  return <ProjectDashboard projectId={params.id} />;
}