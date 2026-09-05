'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Play,
  Cpu,
  Activity,
  Wrench,
  Code2,
  FlaskConical,
  Eye,
  PenSquare,
  Bug,
  Rocket,
  BarChart3,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { label: 'Overview',         href: '/dashboard',            icon: LayoutDashboard },
  { label: 'Projects',         href: '/dashboard/projects',   icon: FolderKanban },
  { label: 'Agent Runs',       href: '/dashboard/runs',       icon: Play },
  { label: 'Queues & Workers', href: '/dashboard/queues',     icon: Cpu },
  { label: 'AI Activity',      href: '/dashboard/activity',   icon: Activity },
  { label: 'Tool Calls',       href: '/dashboard/tools',      icon: Wrench },
  { label: 'Code Changes',     href: '/dashboard/code',       icon: Code2 },
  { label: 'Tests',            href: '/dashboard/tests',      icon: FlaskConical },
  { label: 'Visual QA',        href: '/dashboard/visual',     icon: Eye },
  { label: 'Universal Editor', href: '/dashboard/ue',         icon: PenSquare },
  { label: 'Bugs & Fixes',     href: '/dashboard/bugs',       icon: Bug },
  { label: 'Deployments',      href: '/dashboard/deployments',icon: Rocket },
  { label: 'LLM Usage',        href: '/dashboard/usage',      icon: BarChart3 },
  { label: 'Knowledge',        href: '/dashboard/knowledge',  icon: BookOpen },
  { label: 'Settings',         href: '/dashboard/settings',   icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? '56px' : 'var(--sidebar-width)',
        minHeight: '100vh',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? '16px 12px' : '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          minHeight: 'var(--topbar-height)',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Zap size={16} color="white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontWeight: 700,
                fontSize: '13px',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
              }}
            >
              AI EDS Developer
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--text-tertiary)',
                letterSpacing: '0.05em',
              }}
            >
              v0.1.0-alpha
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: '8px 0',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href as any}
              title={collapsed ? item.label : undefined}

              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: collapsed ? '8px 14px' : '7px 16px',
                margin: '1px 8px',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                transition: 'all 0.1s ease',
                fontSize: '13px',
                fontWeight: isActive ? 500 : 400,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
              className={clsx('nav-item', isActive && 'nav-item-active')}
            >
              <Icon
                size={15}
                color={isActive ? 'var(--accent-primary)' : 'currentColor'}
                style={{ flexShrink: 0 }}
              />
              {!collapsed && (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div
        style={{
          padding: '12px 8px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn btn-ghost btn-sm"
          style={{
            width: '100%',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: 'var(--text-tertiary)',
          }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : (
            <>
              <ChevronLeft size={14} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
