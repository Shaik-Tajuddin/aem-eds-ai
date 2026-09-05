import type { Metadata } from 'next';
import { TopBar } from '../../../components/layout/TopBar';
import { ComingSoonPage } from '../../../components/ui/ComingSoonPage';

export const metadata: Metadata = { title: 'Bugs & Autonomous Fixes — AI EDS Developer' };

export default function BugsPage() {
  return (
    <>
      <TopBar title="Defects & Fix Loops" subtitle="Autonomous diagnosis, root-cause analysis, and regression testing" />
      <ComingSoonPage
        title="Defect Remediation Hub"
        description="Inspect defects caught during validation, the Fix Agent's automated diagnosis, repair attempts, and regression test results."
        phase={9}
        features={[
          'Automated defect classification (Syntax, Visual, A11y, Performance)',
          'Stack trace & console log evidence capture',
          'Iterative repair history with capped iterations',
          'Root-cause analysis and diff verification',
        ]}
      />
    </>
  );
}
