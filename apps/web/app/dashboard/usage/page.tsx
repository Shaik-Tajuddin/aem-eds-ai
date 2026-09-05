'use client';

import { TopBar } from '../../../components/layout/TopBar';
import {
  BarChart3,
  Coins,
  Cpu,
  Zap,
  TrendingUp,
  Clock,
} from 'lucide-react';

const MODEL_USAGE = [
  {
    model: 'claude-3-7-sonnet-20250219',
    provider: 'Anthropic',
    inputTokens: 142800,
    outputTokens: 48900,
    cost: '$0.84',
    avgLatency: '1.2s',
    totalCalls: 64,
  },
  {
    model: 'gpt-4o',
    provider: 'OpenAI',
    inputTokens: 98400,
    outputTokens: 32100,
    cost: '$0.52',
    avgLatency: '980ms',
    totalCalls: 48,
  },
  {
    model: 'llama3.3',
    provider: 'Ollama (Local)',
    inputTokens: 215000,
    outputTokens: 82000,
    cost: '$0.00 (Self-hosted)',
    avgLatency: '640ms',
    totalCalls: 120,
  },
  {
    model: 'nomic-embed-text',
    provider: 'Ollama (Embeddings)',
    inputTokens: 482000,
    outputTokens: 0,
    cost: '$0.00 (Self-hosted)',
    avgLatency: '12ms',
    totalCalls: 310,
  },
];

export default function UsagePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <TopBar
        title="LLM Usage & Cost Analytics"
        subtitle="Real-time token telemetry, provider quotas, and cost optimization metrics"
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Total Cost (MTD)</span>
              <Coins size={16} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>$1.36</div>
            <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>62% saved via local Ollama</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Inference Tokens</span>
              <BarChart3 size={16} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>938.2K</div>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '4px' }}>456.2K prompt / 163K completion</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Total Inferences</span>
              <Cpu size={16} color="var(--color-ai)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>542 Calls</div>
            <div style={{ fontSize: '11px', color: 'var(--color-ai)', marginTop: '4px' }}>0 rate limit errors</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Average TTFT</span>
              <Zap size={16} color="var(--color-warning)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>480 ms</div>
            <div style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '4px' }}>Streaming token delivery</div>
          </div>
        </div>

        {/* Model Usage Table */}
        <div className="card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Usage Breakdown by Model & Provider</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Billing period: September 2026</span>
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
                {MODEL_USAGE.map((m) => (
                  <tr key={m.model} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {m.model}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{m.provider}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{m.totalCalls}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{m.inputTokens.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{m.outputTokens.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{m.avgLatency}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-success)' }}>{m.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
