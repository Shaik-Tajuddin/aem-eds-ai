import type { Metadata } from 'next';
import { Sidebar } from '../../components/layout/Sidebar';
import { FloatingRefreshButton } from '../../components/layout/FloatingRefreshButton';

export const metadata: Metadata = {
  title: 'Overview',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-base)',
      }}
    >
      <Sidebar />
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
          height: '100%',
          // Scroll lives here so TopBar sticky can lock against this container
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {children}
      </main>
      <FloatingRefreshButton />
    </div>
  );
}
