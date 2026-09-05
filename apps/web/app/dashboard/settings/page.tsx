import type { Metadata } from 'next';
import { TopBar } from '../../../components/layout/TopBar';
import { ComingSoonPage } from '../../../components/ui/ComingSoonPage';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <>
      <TopBar title="Settings" subtitle="Platform configuration" />
      <ComingSoonPage
        title="Settings"
        description="Configure global platform settings, default LLM providers, quality gate defaults, security policies, and user management."
        phase={1}
        features={[
          'Default LLM provider configuration',
          'Global quality gate defaults',
          'Agent execution limits',
          'Security and audit settings',
          'User and role management',
          'GitHub OAuth configuration',
        ]}
      />
    </>
  );
}
