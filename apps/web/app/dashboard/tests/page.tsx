import type { Metadata } from 'next';
import { TopBar } from '../../../components/layout/TopBar';
import { ComingSoonPage } from '../../../components/ui/ComingSoonPage';

export const metadata: Metadata = { title: 'Automated Tests — AI EDS Developer' };

export default function TestsPage() {
  return (
    <>
      <TopBar title="Automated Testing Suite" subtitle="Playwright functional tests, accessibility audits, and performance benchmarks" />
      <ComingSoonPage
        title="Test Runner & Quality Gates"
        description="Comprehensive testing results executed against live EDS preview environments using headless Playwright browsers."
        phase={7}
        features={[
          'Playwright end-to-end browser test traces',
          'Axe-core accessibility audit reports',
          'Lighthouse performance scores (Target: 100/100)',
          'Network request failure capture',
          'Automated defect filing for test failures',
        ]}
      />
    </>
  );
}
