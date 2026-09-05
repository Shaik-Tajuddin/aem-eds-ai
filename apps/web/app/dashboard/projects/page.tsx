import type { Metadata } from 'next';
import { TopBar } from '../../../components/layout/TopBar';
import { ComingSoonPage } from '../../../components/ui/ComingSoonPage';

export const metadata: Metadata = { title: 'Projects' };

export default function ProjectsPage() {
  return (
    <>
      <TopBar title="Projects" subtitle="Manage your EDS projects" />
      <ComingSoonPage
        title="Projects"
        description="Create and manage multiple EDS projects, each with their own GitHub repository, AEM environment, LLM configuration, and quality gate settings."
        phase={1}
        features={[
          'Project creation wizard',
          'GitHub repository connection',
          'AEM environment configuration',
          'LLM provider configuration',
          'Quality gate thresholds',
          'Project health dashboard',
        ]}
        actionLabel="Create First Project"
        actionHref="/dashboard/projects/new"
      />
    </>
  );
}
