import type { Metadata } from 'next';
import { Sidebar } from '../../components/layout/Sidebar';

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
        minHeight: '100vh',
        background: 'var(--bg-base)',
      }}
    >
      <Sidebar />
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0, // prevent flex overflow
          overflow: 'hidden',
        }}
      >
        {children}
      </main>
    </div>
  );
}
