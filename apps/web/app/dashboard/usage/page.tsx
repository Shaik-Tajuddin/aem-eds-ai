'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '../../../components/layout/TopBar';
import {
  BarChart3,
  Coins,
  Cpu,
  Zap,
} from 'lucide-react';
import { useProjects } from '../../../lib/project-store';

type UsageResponse = {
  since: string;
  empty: boolean;
  message?: string;
  totals: {
    totalCalls: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    estimatedCostUsdFormatted: string;
    avgLatencyMs: number;
    toolCalls: number;
  };
  byModel: Array<{
    provider: string;
    model: string;
    totalCalls: number;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
    estimatedCostUsdFormatted: string;
    avgLatencyMs: number;
  }>;
};

export default function UsagePage() {
  const { projects } = useProjects();
  const currentProject = projects[0];
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const qs = currentProject?.id ? `?projectId=${encodeURIComponent(currentProject.id)}` : '';
    setLoading(true);
    fetch(`/api/backend/usage${qs}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
        if (!cancelled) {
          setUsage(data as UsageResponse);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setUsage(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentProject?.id]);

  const totals = usage?.totals;
  const modelRows = usage?.byModel?.length
    ? usage.byModel
    : [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <TopBar
        title="LLM Usage & Cost Analytics"
        subtitle="Live token telemetry from llm_calls / tool_calls — zeros mean no recorded runs yet"
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {error ? (
          <div className="card" style={{ padding: '14px 18px', color: 'var(--color-danger, #ef4444)', border: '1px solid rgba(239,68,68,0.3)' }}>
            Failed to load usage: {error}
          </div>
        ) : null}
        {usage?.empty || (!loading && !error && modelRows.length === 0) ? (
          <div className="card" style={{ padding: '14px 18px', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
            {usage?.message || 'No LLM calls recorded yet — run a pipeline to populate usage telemetry.'}
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Total Cost (MTD)</span>
              <Coins size={16} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {loading ? '…' : totals?.estimatedCostUsdFormatted || '$0.0000'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              From persisted llm_calls since {usage?.since ? new Date(usage.since).toLocaleDateString() : 'month start'}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Inference Tokens</span>
              <BarChart3 size={16} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {loading ? '…' : `${(totals?.totalTokens || 0).toLocaleString()} Tokens`}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '4px' }}>
              {(totals?.inputTokens || 0).toLocaleString()} prompt / {(totals?.outputTokens || 0).toLocaleString()} completion
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Total Inferences</span>
              <Cpu size={16} color="var(--color-ai)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {loading ? '…' : `${totals?.totalCalls || 0} Calls`}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-ai)', marginTop: '4px' }}>
              Tool calls: {totals?.toolCalls || 0}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Average Latency</span>
              <Zap size={16} color="var(--color-warning)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {loading ? '…' : totals?.avgLatencyMs ? `${totals.avgLatencyMs}ms` : '—'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '4px' }}>
              Project: {currentProject ? currentProject.name : 'All projects'}
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Usage Breakdown by Model & Provider</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Connected Project: {currentProject ? currentProject.name : 'All'}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Model ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Provider</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Invocations</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Input Tokens</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Output Tokens</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Avg Latency</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {modelRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '20px 16px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                      No model usage rows yet
                    </td>
                  </tr>
                ) : (
                  modelRows.map((m) => (
                    <tr key={`${m.provider}-${m.model}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {m.model}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{m.provider}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{m.totalCalls}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{m.inputTokens.toLocaleString()}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{m.outputTokens.toLocaleString()}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{m.avgLatencyMs ? `${m.avgLatencyMs}ms` : '—'}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-success)' }}>{m.estimatedCostUsdFormatted}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
