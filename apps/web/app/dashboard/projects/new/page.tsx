import type { Metadata } from 'next';
import { TopBar } from '../../../../components/layout/TopBar';
import { NewProjectWizard } from '../../../../components/projects/NewProjectWizard';

export const metadata: Metadata = { title: 'New Project | AI EDS Developer' };

export default function NewProjectPage() {
  return (
    <>
      <TopBar title="New Project" subtitle="Connect your EDS project to AI" />
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 24px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <NewProjectWizard />
      </div>
    </>
  );
}
