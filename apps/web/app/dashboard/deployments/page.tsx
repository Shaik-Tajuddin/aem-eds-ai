import type { Metadata } from 'next';
import { TopBar } from '../../../components/layout/TopBar';
import { ComingSoonPage } from '../../../components/ui/ComingSoonPage';

export const metadata: Metadata = { title: 'Deployments & PRs — AI EDS Developer' };

export default function DeploymentsPage() {
  return (
    <>
      <TopBar title="Deployments & Pull Requests" subtitle="Live AEM Edge Delivery Services preview URLs, production deployments, and PR status" />
      <ComingSoonPage
        title="Deployment Assistant"
        description="Track live branch deployments to the Franklin/Helix CDN (.hlx.page and .aem.page), review open PRs, and manage approvals."
        phase={10}
        features={[
          'Live EDS Preview URL status checker',
          'GitHub Pull Request synchronization',
          'AEM Cloud production publish integration',
          'Fast CDN purge and cache invalidation status',
        ]}
      />
    </>
  );
}
