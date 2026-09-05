import type { Metadata } from 'next';
import { TopBar } from '../../../components/layout/TopBar';
import { ComingSoonPage } from '../../../components/ui/ComingSoonPage';

export const metadata: Metadata = { title: 'Visual QA' };

export default function VisualPage() {
  return (
    <>
      <TopBar title="Visual QA" subtitle="Screenshot comparison and visual scoring" />
      <ComingSoonPage
        title="Visual QA"
        description="Side-by-side reference vs implementation comparison with pixel-level diff and vision AI analysis. Tracks visual score across all fix iterations."
        phase={9}
        features={[
          'Reference vs implementation side-by-side',
          'Pixel / perceptual diff',
          'Vision AI mismatch analysis',
          'Score per iteration history',
          'Mismatch region highlighting',
          'Viewport comparison (desktop / tablet / mobile)',
        ]}
      />
    </>
  );
}
