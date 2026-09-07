'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { TopBar } from '../../../../components/layout/TopBar';
import { getProjectById } from '../../../../lib/project-store';
import {
  GitBranch,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Terminal,
  ShieldCheck,
  Bot,
  Zap,
  Check,
  RotateCw,
  GitPullRequest,
  Lock,
  X,
  Play,
  Pause,
  Layers,
  Wrench,
  Cpu,
  BarChart3,
  Eye,
  Sliders,
} from 'lucide-react';
import { isTerminalRunStatus, POLL_ACTIVE_MS } from '../../../../lib/utils';

const PIPELINE_STAGE_DEFS: Array<{ name: string; statusKey: string }> = [
  { name: 'Analyze', statusKey: 'ANALYZING' },
  { name: 'Plan', statusKey: 'PLANNING' },
  { name: 'Build Blocks', statusKey: 'IMPLEMENTING' },
  { name: 'CSS + JS', statusKey: 'BUILDING' },
  { name: 'Deploy Preview', statusKey: 'DEPLOYING_PREVIEW' },
  { name: 'UE Models', statusKey: 'UE_AUTHORING' },
  { name: 'Browser Tests', statusKey: 'FUNCTIONAL_TESTING' },
  { name: 'Visual Validation', statusKey: 'VISUAL_VALIDATION' },
  { name: 'Accessibility', statusKey: 'ACCESSIBILITY' },
  { name: 'Performance', statusKey: 'PERFORMANCE' },
  { name: 'Quality Gate', statusKey: 'QUALITY_GATE' },
  { name: 'PR Created', statusKey: 'PR_CREATED' },
  { name: 'Waiting Approval', statusKey: 'WAITING_APPROVAL' },
];

type StageStatus = 'DONE' | 'LIVE' | 'WAIT' | 'FAIL';

type ConsoleLine = {
  id: string;
  ts: string;
  level: 'info' | 'warn' | 'error' | 'sys';
  text: string;
  phase: string;
};

function inferLogLevel(text: string, type: string): ConsoleLine['level'] {
  const typeNorm = type.toLowerCase();
  // LLM payloads often contain the words "error"/"failed" inside code — don't paint them red
  if (typeNorm.includes('llm.request') || typeNorm.includes('llm.completed')) {
    return 'info';
  }
  if (typeNorm.includes('llm.failed')) {
    return 'warn';
  }
  if (text.startsWith('▶ LLM REQUEST') || text.startsWith('◀ LLM RESPONSE') || text.startsWith('──── ASSISTANT')) {
    return 'info';
  }
  const lower = text.toLowerCase();
  if (type.includes('failed') || type.includes('FAILED') || lower.startsWith('✖')) {
    return 'error';
  }
  if (
    lower.includes('skip') ||
    lower.includes('warn') ||
    lower.includes('invalid json') ||
    lower.includes('retrying') ||
    lower.includes('never returned valid json')
  ) {
    return 'warn';
  }
  if (type.includes('COMPLETED') || type.includes('STARTED') || type.includes('completed') || type.includes('started')) {
    return 'sys';
  }
  return 'info';
}

function buildLivePipelineStages(currentStatus: string, failed: boolean) {
  const order = PIPELINE_STAGE_DEFS.map((s) => s.statusKey);
  let idx = order.indexOf(currentStatus);
  if (currentStatus === 'COMPLETED' || currentStatus === 'DEPLOYED') idx = order.length - 1;
  if (currentStatus === 'RECEIVED') idx = -1;
  if (currentStatus === 'DIAGNOSING' || currentStatus === 'FIXING' || currentStatus === 'REGRESSION_TESTING') {
    idx = order.indexOf('QUALITY_GATE');
  }
  const terminalPass = ['WAITING_APPROVAL', 'DEPLOYED', 'PR_CREATED', 'COMPLETED'].includes(currentStatus);

  return PIPELINE_STAGE_DEFS.map((st, i) => {
    let status: StageStatus = 'WAIT';
    if (failed && i === Math.max(idx, 0)) status = 'FAIL';
    else if (idx > i) status = 'DONE';
    else if (idx === i) status = failed ? 'FAIL' : terminalPass ? 'DONE' : 'LIVE';
    return { ...st, status };
  });
}

function buildStageConsole(events: any[]): {
  lines: ConsoleLine[];
  byPhase: Record<string, ConsoleLine[]>;
} {
  const lines: ConsoleLine[] = [];
  let lastPhase = 'RECEIVED';

  events.forEach((e, idx) => {
    const data = (e.data || {}) as Record<string, unknown>;
    const type = String(e.type || '');
    let phase = String(data.phase || e.step || '').toUpperCase();
    if (!phase || phase === 'PIPELINE' || phase === 'UNDEFINED') {
      phase = lastPhase;
    } else {
      lastPhase = phase;
    }
    const ts = e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : '—';
    const files = Array.isArray(data.filesGenerated) ? (data.filesGenerated as string[]) : [];
    const message = data.message
      ? String(data.message)
      : data.error
        ? String(data.error)
        : '';

    const chunks: string[] = [];
    const typeNorm = type.toLowerCase();

    if (typeNorm === 'llm.request' || typeNorm.includes('llm.request')) {
      const attempt =
        typeof data.attempt === 'number' && typeof data.maxAttempts === 'number'
          ? ` · attempt ${data.attempt}/${data.maxAttempts}`
          : '';
      chunks.push(`▶ LLM REQUEST${attempt}${message ? ` — ${message}` : ''}`);
      const model = data.model ? String(data.model) : '';
      if (model) chunks.push(`model: ${model}`);
      const messages = Array.isArray(data.messages) ? data.messages : [];
      for (const m of messages) {
        const role = String((m as any)?.role || 'message');
        const content = String((m as any)?.content || '');
        chunks.push(`──── ${role.toUpperCase()} ────\n${content}`);
      }
      if (messages.length === 0 && data.prompt) {
        chunks.push(String(data.prompt));
      }
    } else if (typeNorm === 'llm.completed' || typeNorm.includes('llm.completed')) {
      const attempt =
        typeof data.attempt === 'number' && typeof data.maxAttempts === 'number'
          ? ` · attempt ${data.attempt}/${data.maxAttempts}`
          : '';
      chunks.push(`◀ LLM RESPONSE${attempt}${message ? ` — ${message}` : ''}`);
      const meta: string[] = [];
      if (data.model) meta.push(`model=${data.model}`);
      if (typeof data.latencyMs === 'number') meta.push(`latency=${data.latencyMs}ms`);
      if (typeof data.inputTokens === 'number') meta.push(`in=${data.inputTokens}`);
      if (typeof data.outputTokens === 'number') meta.push(`out=${data.outputTokens}`);
      if (meta.length) chunks.push(meta.join(' · '));
      const content = data.content != null ? String(data.content) : '';
      chunks.push(
        content.trim()
          ? `──── ASSISTANT ────\n${content}`
          : '──── ASSISTANT ────\n(empty response body)',
      );
    } else if (typeNorm === 'llm.failed' || typeNorm.includes('llm.failed')) {
      chunks.push(`◀ LLM RESPONSE (parse/request issue)${message ? ` — ${message}` : ''}`);
      if (data.error && String(data.error) !== message) chunks.push(String(data.error));
      const failedContent = data.content != null ? String(data.content) : '';
      chunks.push(
        failedContent.trim()
          ? `──── ASSISTANT (raw) ────\n${failedContent}`
          : '──── ASSISTANT (raw) ────\n(empty response body)',
      );
    } else if (type.includes('STARTED') || type.includes('started')) {
      chunks.push(message || `▶ enter ${phase}${data.currentStage ? ` (${data.currentStage})` : ''}`);
    } else if (type.includes('COMPLETED') || type.includes('completed')) {
      chunks.push(message || `■ leave ${phase}`);
      if (files.length) chunks.push(`files: ${files.join(', ')}`);
      if (typeof data.progress === 'number') chunks.push(`progress=${data.progress}%`);
    } else if (type.includes('FAILED') || type.includes('failed')) {
      chunks.push(message || `✖ ${phase} failed`);
    } else if (message) {
      chunks.push(message);
    } else if (files.length) {
      chunks.push(`files: ${files.join(', ')}`);
    } else {
      chunks.push(`${type || 'event'} @ ${phase}`);
    }

    chunks.forEach((text, cIdx) => {
      lines.push({
        id: `${e.id || idx}-${cIdx}`,
        ts,
        level: inferLogLevel(text, type),
        text,
        phase,
      });
    });
  });

  const byPhase: Record<string, ConsoleLine[]> = {};
  for (const line of lines) {
    const key = line.phase;
    if (!byPhase[key]) byPhase[key] = [];
    byPhase[key].push(line);
  }

  return { lines, byPhase };
}

function stageActivityHint(lines: ConsoleLine[]): string {
  if (lines.length === 0) return 'no logs yet';
  const joined = lines.map((l) => l.text).join(' ').toLowerCase();
  if (joined.includes('github publish skipped') || joined.includes('files remain in-memory')) {
    return 'stub · no GitHub push';
  }
  if (joined.includes('opened pull request') || joined.includes('committed')) {
    return 'real GitHub work';
  }
  if (joined.includes('──── system ────') || joined.includes('──── assistant ────') || joined.includes('llm request')) {
    return 'full LLM request/response';
  }
  if (joined.includes('asking llm') || joined.includes('llm responded')) {
    return 'LLM block generation';
  }
  if (joined.includes('generated blocks/') || joined.includes('files:')) {
    return 'generated files (in-memory)';
  }
  if (
    lines.every(
      (l) =>
        l.text.startsWith('▶ enter') ||
        l.text.startsWith('■ leave') ||
        l.text.includes('Bundled') ||
        l.text.includes('Compared') ||
        l.text.includes('Ran WCAG') ||
        l.text.includes('Checked Core') ||
        l.text.includes('Evaluated visual') ||
        l.text.includes('Staging preview') ||
        l.text.includes('Waiting for human'),
    )
  ) {
    return 'state advance only (thin evidence)';
  }
  return `${lines.length} log line${lines.length === 1 ? '' : 's'}`;
}
export default function RunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = (params?.id as string) || '';

  const [activeTab, setActiveTab] = useState<'pipeline' | 'evidence' | 'tools' | 'authoring' | 'tests' | 'cwv' | 'pr'>('pipeline');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [approvalLog, setApprovalLog] = useState<string | null>(null);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string>('LOADING');
  const [testFilter, setTestFilter] = useState<'all' | 'pass' | 'fail'>('all');
  const [project, setProject] = useState<any>(null);
  const [liveRun, setLiveRun] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRerunning, setIsRerunning] = useState(false);
  const [rerunError, setRerunError] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [consoleScope, setConsoleScope] = useState<string>('ALL');
  const [consoleFollow, setConsoleFollow] = useState(true);
  const consoleEndRef = React.useRef<HTMLDivElement | null>(null);
  const projectFetchedFor = React.useRef<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadRun = React.useCallback(async (): Promise<boolean> => {
    if (!rawId) return false;
    try {
      const runRes = await fetch(`/api/backend/runs/${rawId}`);
      const runData = await runRes.json().catch(() => ({}));

      if (!runRes.ok || !runData?.run) {
        setLiveRun(null);
        setLoadError(runData?.error || 'Run not found');
        setRunStatus('NOT_FOUND');
        setLoading(false);
        return false;
      }

      const run = runData.run;
      setLiveRun(run);
      setRunStatus(run.status || 'RECEIVED');
      setLoadError(null);

      const eventsRes = await fetch(`/api/backend/runs/${rawId}/events?limit=500`);
      const eventsData = await eventsRes.json().catch(() => ({}));
      if (Array.isArray(eventsData.events)) {
        setEvents(eventsData.events);
      }

      const projectId = run.projectId as string | undefined;
      if (projectId && projectFetchedFor.current !== projectId) {
        const pRes = await fetch(`/api/backend/projects/${projectId}`);
        const pData = await pRes.json().catch(() => ({}));
        if (pData?.project) {
          setProject(pData.project);
          projectFetchedFor.current = projectId;
        } else {
          const listRes = await fetch('/api/backend/projects');
          const listData = await listRes.json().catch(() => ({}));
          const found = listData?.projects?.find((p: any) => p.id === projectId);
          if (found) {
            setProject(found);
            projectFetchedFor.current = projectId;
          }
        }
      }

      setLoading(false);
      return !isTerminalRunStatus(run.status);
    } catch {
      setLoadError('Failed to load run');
      setRunStatus('ERROR');
      setLoading(false);
      return false;
    }
  }, [rawId]);

  useEffect(() => {
    if (!rawId) {
      setLoadError('Missing run id');
      setLoading(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      const stillActive = await loadRun();
      if (cancelled) return;
      // Fast poll only while pipeline is advancing; stop when terminal
      if (stillActive) {
        timer = setTimeout(tick, POLL_ACTIVE_MS);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [rawId, loadRun, refreshKey]);

  const handleApprove = async (opts?: { mergePullRequest?: boolean }) => {
    if (!liveRun?.id || runStatus !== 'WAITING_APPROVAL') return;
    setApprovalBusy(true);
    setApprovalError(null);
    try {
      const res = await fetch(`/api/backend/runs/${liveRun.id}/approve-deployment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mergePullRequest: opts?.mergePullRequest === true,
          note: 'Approved from run detail UI',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setIsApproved(true);
      setShowApprovalModal(false);
      setRunStatus('DEPLOYED');
      setApprovalLog(
        data?.mergeResult?.merged
          ? `Approved and merged at ${new Date().toLocaleTimeString()} (PR merge confirmed)`
          : `Approved at ${new Date().toLocaleTimeString()} (DEPLOYED; merge ${opts?.mergePullRequest ? 'attempted' : 'not requested'})`,
      );
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      setApprovalError(err instanceof Error ? err.message : String(err));
    } finally {
      setApprovalBusy(false);
    }
  };

  const handleReject = async () => {
    if (!liveRun?.id || runStatus !== 'WAITING_APPROVAL') return;
    setApprovalBusy(true);
    setApprovalError(null);
    try {
      const res = await fetch(`/api/backend/runs/${liveRun.id}/reject-deployment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Rejected from run detail UI' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setShowApprovalModal(false);
      setRunStatus('CANCELLED');
      setApprovalLog(`Rejected at ${new Date().toLocaleTimeString()}`);
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      setApprovalError(err instanceof Error ? err.message : String(err));
    } finally {
      setApprovalBusy(false);
    }
  };

  const handlePauseToggle = async () => {
    if (!liveRun?.id) return;
    const next = runStatus === 'PAUSED' ? 'resume' : 'pause';
    if (next === 'pause') {
      await fetch(`/api/backend/runs/${liveRun.id}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }).catch(() => null);
      setRunStatus('PAUSED');
    } else {
      await fetch(`/api/backend/runs/${liveRun.id}/resume`, { method: 'POST' }).catch(() => null);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleRerun = async () => {
    if (!liveRun?.projectId || isRerunning) return;
    setIsRerunning(true);
    setRerunError(null);
    try {
      const sourceAliases: Record<string, string> = {
        AEM_PAGE: 'EXISTING_AEM_PAGE',
        PROMPT: 'NATURAL_LANGUAGE',
      };
      const rawSource = String(liveRun.source || project?.sourceType || 'EXISTING_WEBSITE');
      const source = sourceAliases[rawSource] || rawSource;

      const res = await fetch('/api/backend/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: liveRun.projectId,
          source,
          sourceUrl: liveRun.sourceUrl || project?.sourceUrl || undefined,
          branch: liveRun.branch || project?.branch || 'main',
          maxIterations: liveRun.maxIterations || 5,
          taskTitle: `Re-run of ${liveRun.id.slice(0, 8)}… for ${project?.name || 'project'}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.run?.id) {
        throw new Error(data?.error || data?.details?.[0]?.message || `HTTP ${res.status}`);
      }
      router.push(`/dashboard/runs/${data.run.id}`);
    } catch (err: any) {
      setRerunError(err?.message || 'Failed to start re-run');
      setIsRerunning(false);
    }
  };

  const { lines: consoleLines, byPhase: consoleByPhase } = buildStageConsole(events);

  useEffect(() => {
    if (!consoleFollow || activeTab !== 'pipeline') return;
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [consoleLines.length, consoleScope, consoleFollow, activeTab]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading run…</div>
      </div>
    );
  }

  if (loadError || !liveRun) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Run Not Found" subtitle={rawId || 'No run id'} />
        <div style={{ padding: '60px 24px', textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Run not in database
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5, marginBottom: '12px' }}>
            {loadError || 'This run id does not exist.'} Synthetic ids like{' '}
            <code>run-{'{projectId}'}-01</code> are no longer valid — start a run from the project page
            so a real UUID is created.
          </p>
          <Link href="/dashboard/runs" className="btn btn-primary btn-sm">
            Back to Agent Runs
          </Link>
        </div>
      </div>
    );
  }

  const projectName = project?.name || 'EDS Project';
  const repoName = project?.repo || project?.githubRepo || '—';
  const branchName = liveRun.branch || project?.branch || project?.defaultBranch || 'main';
  const modelName = project?.llmModel || project?.llmProvider || liveRun.model || '—';
  const previewUrl = project?.aemEnvironment || project?.aemPreviewUrl || '#';
  const sourceUrl = liveRun.sourceUrl || project?.sourceUrl || '—';
  const sourceType = liveRun.source || project?.sourceType || '—';
  const authoringPath = project?.aemAuthoringPath || '—';
  const isTerminal =
    ['DEPLOYED', 'CANCELLED', 'FAILED', 'LIMIT_REACHED', 'WAITING_APPROVAL', 'PR_CREATED'].includes(runStatus) ||
    runStatus === 'COMPLETED';
  const statusBadgeClass =
    runStatus === 'FAILED' || runStatus === 'CANCELLED'
      ? 'badge-error'
      : runStatus === 'PAUSED'
        ? 'badge-warning'
        : isTerminal
          ? 'badge-success'
          : 'badge-info';
  const durationLabel = liveRun.durationMs
    ? `${Math.floor(liveRun.durationMs / 60000)}m ${Math.floor((liveRun.durationMs % 60000) / 1000)}s`
    : liveRun.startedAt
      ? `since ${new Date(liveRun.startedAt).toLocaleTimeString()}`
      : '—';
  const progressPct = Math.round((liveRun.progress ?? 0) * (liveRun.progress <= 1 ? 100 : 1));
  const pipelineStages = buildLivePipelineStages(runStatus, runStatus === 'FAILED');

  const visibleConsoleLines =
    consoleScope === 'ALL'
      ? consoleLines
      : consoleByPhase[consoleScope] || [];

  const generatedFiles = Array.from(
    new Set(
      events.flatMap((e) => {
        const files = (e?.data as any)?.filesGenerated;
        return Array.isArray(files) ? files : [];
      }),
    ),
  );

  const auditTrail = events
    .filter((e) => {
      const t = String(e.type || '');
      return (
        t.includes('step.') ||
        t.includes('agent.started') ||
        t.includes('agent.completed') ||
        t.includes('agent.failed') ||
        t === 'AGENT_STEP_STARTED' ||
        t === 'AGENT_STEP_COMPLETED' ||
        t === 'AGENT_STARTED' ||
        t === 'AGENT_COMPLETED' ||
        t === 'AGENT_FAILED'
      );
    })
    .map((e, idx) => {
      const data = (e.data || {}) as Record<string, unknown>;
      const phase = String(data.phase || e.step || 'pipeline');
      const isStart = String(e.type).includes('started') || String(e.type).includes('STARTED');
      const isFail = String(e.type).includes('failed') || String(e.type).includes('FAILED');
      const files = Array.isArray(data.filesGenerated) ? (data.filesGenerated as string[]) : [];
      const message = data.message ? String(data.message) : data.error ? String(data.error) : '';
      const text = isFail
        ? message || `Stage ${phase} failed`
        : files.length
          ? `${phase}: generated ${files.join(', ')}`
          : message || `${isStart ? 'Started' : 'Completed'} stage ${phase}${data.currentStage ? ` (${data.currentStage})` : ''}`;
      return {
        step: `${idx + 1}. ${phase}`,
        ai: isStart && !isFail,
        label: isFail ? 'SYSTEM EVIDENCE' : isStart ? 'AI CLAIM' : 'SYSTEM EVIDENCE',
        text,
        time: e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : '—',
      };
    });

  const toolCalls = events
    .filter((e) => {
      const t = String(e.type || '');
      return t.includes('step.') || t.includes('STEP') || t.includes('tool') || t.includes('TOOL');
    })
    .map((e) => {
      const data = (e.data || {}) as Record<string, unknown>;
      return {
        name: String(data.phase || e.step || e.type),
        params: JSON.stringify({
          status: e.status,
          currentStage: data.currentStage,
          progress: data.progress,
        }),
        result: Array.isArray(data.filesGenerated)
          ? JSON.stringify({ files: data.filesGenerated })
          : data.message
            ? String(data.message)
            : JSON.stringify(data).slice(0, 180),
        duration: '—',
        status: String(e.status || 'ok').toUpperCase(),
      };
    });

  const eventCount = events.length;
  const fixIterations = liveRun.iteration ?? 0;
  const maxFixIterations = liveRun.maxIterations ?? 5;
  const runtimeBudgetMs = 30 * 60 * 1000;
  const usedMs = liveRun.durationMs ?? 0;
  const runtimeUsedLabel =
    usedMs > 0
      ? usedMs >= 60000
        ? `${Math.floor(usedMs / 60000)}m ${Math.floor((usedMs % 60000) / 1000)}s`
        : `${Math.floor(usedMs / 1000)}s`
      : '0s';
  const llmCalls = liveRun.totalLLMCalls ?? 0;
  const toolCallCount = (liveRun.totalToolCalls && liveRun.totalToolCalls > 0)
    ? liveRun.totalToolCalls
    : eventCount;
  const costUsd = liveRun.estimatedCostUsd ?? 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title={`Run ${rawId}`}
        subtitle={`${runStatus}${liveRun.currentStage ? ` · ${liveRun.currentStage}` : ''} · progress ${progressPct}%`}
        onRefresh={() => setRefreshKey((k) => k + 1)}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePauseToggle}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              disabled={runStatus === 'PAUSED' ? true : isTerminal}
            >
              {runStatus === 'PAUSED' ? <Play size={13} /> : <Pause size={13} />}
              <span>{runStatus === 'PAUSED' ? 'Paused' : 'Pause Run'}</span>
            </button>
            <button
              type="button"
              onClick={handleRerun}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              disabled={isRerunning}
              title="Start a new pipeline run with the same project and source settings"
            >
              <RotateCw size={13} />
              <span>{isRerunning ? 'Starting…' : 'Re-run Pipeline'}</span>
            </button>
            <Link
              href="/dashboard/runs"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>All Runs</span>
            </Link>
          </div>
        }
      />

      <div style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Back Link */}
        <div>
          <Link
            href="/dashboard/runs"
            className="btn btn-ghost btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} /> Back to All Runs
          </Link>
        </div>

        {rerunError && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239,68,68,0.12)',
              color: 'var(--color-error)',
              fontSize: '13px',
            }}
          >
            Re-run failed: {rerunError}
          </div>
        )}

        {/* Run Header Banner */}
        <div
          className="card"
          style={{
            padding: '24px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {rawId}
              </span>
              <span className={`badge ${statusBadgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {isTerminal ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                {runStatus}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Duration: {durationLabel}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Bot size={14} color="var(--color-ai)" />
                Project: <strong>{projectName}</strong>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Cpu size={14} color="var(--accent-primary)" />
                Model: <code>{modelName}</code>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <GitBranch size={14} />
                Branch: <code>{branchName}</code>
                {liveRun.gitCommit ? <> (Commit <code>{liveRun.gitCommit}</code>)</> : null}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                Source: <code>{sourceType}</code>
              </span>
            </div>
            {!isTerminal && (
              <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Live run from API — stage status and events refresh automatically.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ExternalLink size={13} /> View Live Preview
            </a>
          </div>
        </div>

        {/* Live metrics from run record + events */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Fix Iterations</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              Iteration {fixIterations} / {maxFixIterations}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>From run record</div>
          </div>

          <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Execution Runtime</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {runtimeUsedLabel} / 30m 00s
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {Math.max(0, Math.round((runtimeBudgetMs - usedMs) / 1000))}s budget remaining
            </div>
          </div>

          <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Events / Tool Calls</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {toolCallCount} events
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Recorded agent events for this run</div>
          </div>

          <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>LLM Usage & Cost</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {llmCalls} calls (${Number(costUsd).toFixed(3)})
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {generatedFiles.length} file(s) generated in-memory
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', overflowX: 'auto' }}>
          {[
            { id: 'pipeline', label: 'Stage Console' },
            { id: 'evidence', label: `Audit Trail (${auditTrail.length})` },
            { id: 'tools', label: `Events (${toolCalls.length})` },
            { id: 'authoring', label: `Generated Files (${generatedFiles.length})` },
            { id: 'tests', label: 'Browser Tests' },
            { id: 'cwv', label: 'Quality & CWV' },
            { id: 'pr', label: 'Pull Request & Approvals' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: activeTab === t.id ? 600 : 500,
                color: activeTab === t.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                background: activeTab === t.id ? 'var(--bg-elevated)' : 'transparent',
                borderRadius: 'var(--radius-md)',
                border: activeTab === t.id ? '1px solid var(--border-strong)' : '1px solid transparent',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: STAGE CONSOLE */}
        <div id="tab-pipeline" style={{ display: activeTab === 'pipeline' ? 'block' : 'none' }}>
          <div
            className="card"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: 'minmax(220px, 280px) 1fr',
              minHeight: '520px',
            }}
          >
            {/* Stage picker */}
            <div
              style={{
                borderRight: '1px solid var(--border-subtle)',
                background: 'var(--bg-elevated)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '640px',
                overflow: 'auto',
              }}
            >
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Terminal size={14} color="var(--accent-primary)" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Stages</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  Click a stage to inspect what it actually did — not just DONE.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConsoleScope('ALL')}
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  border: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  background: consoleScope === 'ALL' ? 'rgba(59,130,246,0.12)' : 'transparent',
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700 }}>Full stream</div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {consoleLines.length} lines · all phases
                </div>
              </button>

              {pipelineStages.map((st, i) => {
                const phaseLines = consoleByPhase[st.statusKey] || [];
                const hint = stageActivityHint(phaseLines);
                const selected = consoleScope === st.statusKey;
                const tone =
                  st.status === 'DONE'
                    ? 'var(--color-success)'
                    : st.status === 'LIVE'
                      ? 'var(--color-info)'
                      : st.status === 'FAIL'
                        ? 'var(--color-error)'
                        : 'var(--text-tertiary)';
                return (
                  <button
                    key={st.statusKey}
                    type="button"
                    onClick={() => setConsoleScope(st.statusKey)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      border: 'none',
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      background: selected ? 'rgba(59,130,246,0.12)' : 'transparent',
                      borderLeft: selected ? '3px solid var(--accent-primary)' : '3px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {i + 1}. {st.name}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: tone, fontFamily: 'var(--font-mono)' }}>
                        {st.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                      {hint}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Console panel */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, background: '#0b1220' }}>
              <div
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid rgba(148,163,184,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>
                    {consoleScope === 'ALL' ? 'run@pipeline:~$' : `run@${consoleScope.toLowerCase()}:~$`}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {visibleConsoleLines.length} line{visibleConsoleLines.length === 1 ? '' : 's'}
                    {consoleScope !== 'ALL' ? ` · ${stageActivityHint(visibleConsoleLines)}` : ''}
                  </div>
                </div>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={consoleFollow}
                    onChange={(e) => setConsoleFollow(e.target.checked)}
                  />
                  Auto-scroll
                </label>
              </div>

              <div
                style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '12px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  lineHeight: 1.55,
                  maxHeight: '580px',
                }}
              >
                {visibleConsoleLines.length === 0 ? (
                  <div style={{ color: '#64748b' }}>
                    # waiting for agent events…
                    <br />
                    # stages that only flip state will look thin here — that is the issue signal.
                  </div>
                ) : (
                  visibleConsoleLines.map((line) => {
                    const color =
                      line.level === 'error'
                        ? '#f87171'
                        : line.level === 'warn'
                          ? '#fbbf24'
                          : line.level === 'sys'
                            ? '#64748b'
                            : '#cbd5e1';
                    return (
                      <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '72px 56px 1fr', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ color: '#475569' }}>{line.ts}</span>
                        <span style={{ color: '#64748b' }}>
                          {consoleScope === 'ALL' ? line.phase.slice(0, 6) : line.level.toUpperCase()}
                        </span>
                        <span style={{ color, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{line.text}</span>
                      </div>
                    );
                  })
                )}
                <div ref={consoleEndRef} />
              </div>
            </div>
          </div>
        </div>

        {/* TAB 2: AI CLAIM VS SYSTEM EVIDENCE (TC-RUN-003, TC-RUN-004) */}
        <div id="tab-evidence" style={{ display: activeTab === 'evidence' ? 'block' : 'none' }}>
          <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  Live Audit Trail (from agent events)
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Built from GET /api/runs/:id/events — not demo narrative.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span className="badge badge-purple" style={{ fontSize: '11px' }}>AI CLAIM</span>
                <span className="badge badge-success" style={{ fontSize: '11px' }}>SYSTEM EVIDENCE</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {auditTrail.length === 0 ? (
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>
                  No agent events recorded for this run yet.
                </p>
              ) : (
                auditTrail.map((a, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: a.ai ? 'rgba(168, 85, 247, 0.06)' : 'rgba(34, 197, 94, 0.06)',
                    border: `1px solid ${a.ai ? 'rgba(168, 85, 247, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{a.step}</span>
                      <span className={a.ai ? 'badge badge-purple' : 'badge badge-success'} style={{ fontSize: '10px' }}>
                        {a.label}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {a.text}
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    {a.time}
                  </span>
                </div>
              ))
              )}
            </div>
          </div>
        </div>

        {/* TAB 3: TOOLS & LLM DETAILS (TC-RUN-005, TC-RUN-006) */}
        <div id="tab-tools" style={{ display: activeTab === 'tools' ? 'block' : 'none' }}>
          <div className="card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Live stage / tool events
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{toolCalls.length} rows</span>
            </div>

            {toolCalls.length === 0 ? (
              <p style={{ padding: '20px', margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>
                No events yet for this run.
              </p>
            ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Step / Tool</th>
                  <th style={{ padding: '12px 16px' }}>Payload</th>
                  <th style={{ padding: '12px 16px' }}>Result</th>
                  <th style={{ padding: '12px 16px' }}>Duration</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {toolCalls.map((tc, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{tc.name}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>{tc.params}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>{tc.result}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{tc.duration}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge-success">{tc.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>

        {/* TAB: GENERATED FILES (live from events) */}
        <div id="tab-authoring" style={{ display: activeTab === 'authoring' ? 'block' : 'none' }}>
          <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Files generated by this run (in-memory)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              These paths were emitted by agent events. They are not yet published to AEM preview ({previewUrl}).
            </p>
            {generatedFiles.length === 0 ? (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>No generated files recorded in events.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '18px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>
                {generatedFiles.map((f) => (
                  <li key={f} style={{ marginBottom: '6px' }}>{f}</li>
                ))}
              </ul>
            )}
            <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Authoring path config: <code>{authoringPath}</code> · Source: <code>{sourceUrl}</code>
            </p>
          </div>
        </div>

        {/* TAB: BROWSER TESTS — no live harness yet */}
        <div id="tab-tests" style={{ display: activeTab === 'tests' ? 'block' : 'none' }}>
          <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Browser & Contract Tests
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              No Playwright/browser-worker evidence is stored for this run yet. Functional testing currently runs as an in-process QA agent step (see Audit Trail / Events), not a 24/24 mock suite.
            </p>
          </div>
        </div>

        {/* TAB: QUALITY & CWV — no live Lighthouse yet */}
        <div id="tab-cwv" style={{ display: activeTab === 'cwv' ? 'block' : 'none' }}>
          <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Quality & Core Web Vitals
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              No live Lighthouse / axe / visual-diff scores are persisted for this run. Pipeline stages ACCESSIBILITY / PERFORMANCE / VISUAL_VALIDATION advanced in the state machine, but metrics were not written to the database.
            </p>
          </div>
        </div>

        {/* TAB 6: PULL REQUEST & APPROVAL GATES (TC-RUN-013, TC-GATE-001, TC-GATE-002) */}
        <div id="tab-pr" style={{ display: activeTab === 'pr' ? 'block' : 'none' }}>
          <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                GitHub Pull Request & Human Approval Gate
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                Pipeline status <code>{runStatus}</code> for <strong>{projectName}</strong> on branch <code>{branchName}</code>.
                {liveRun.pullRequestUrl
                  ? ' A real GitHub PR was opened for this run.'
                  : ' No PR URL is stored yet — set GITHUB_TOKEN (and repo write access) so the deployment agent can open one.'}
              </p>
            </div>

            {liveRun.pullRequestUrl ? (
              <div style={{ padding: '14px 18px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <GitPullRequest size={18} color="var(--color-success)" />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {repoName}
                    {liveRun.pullRequestNumber ? ` #${liveRun.pullRequestNumber}` : ''}:{' '}
                    {liveRun.pullRequestTitle || 'AI EDS pipeline PR'}
                  </span>
                  <span className="badge badge-success" style={{ fontSize: '11px', fontWeight: 700 }}>
                    ● {(liveRun.pullRequestStatus || 'open').toUpperCase()}
                  </span>
                </div>
                <a
                  href={liveRun.pullRequestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-xs"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>Open in GitHub</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            ) : (
              <div style={{ padding: '14px 18px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                No pull request linked to this run. Re-run the pipeline after configuring <code>GITHUB_TOKEN</code> with write access to <code>{repoName}</code>.
              </div>
            )}

            {/* Human Gate Actions */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Production Deployment Safety Gate
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Only available when the run is <code>WAITING_APPROVAL</code>. Calls{' '}
                <code>POST /api/runs/:id/approve-deployment</code> (or reject). Merge to GitHub only when explicitly requested and credentials allow — never invented.
              </p>

              {runStatus === 'DEPLOYED' || isApproved ? (
                <div style={{ padding: '12px 16px', background: 'var(--color-success-dim)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} />
                  <span>{approvalLog || 'Deployment approved (DEPLOYED)'}</span>
                </div>
              ) : runStatus === 'CANCELLED' && approvalLog ? (
                <div style={{ padding: '12px 16px', background: 'var(--color-danger-dim, rgba(239,68,68,0.1))', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger, #ef4444)', fontSize: '13px' }}>
                  {approvalLog}
                </div>
              ) : runStatus === 'WAITING_APPROVAL' ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    onClick={() => setShowApprovalModal(true)}
                    disabled={approvalBusy}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Lock size={13} />
                    <span>Approve Deployment</span>
                  </button>
                  <button
                    onClick={() => void handleReject()}
                    disabled={approvalBusy}
                    className="btn btn-secondary btn-sm"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>
                  Gate unlocks when status is WAITING_APPROVAL (current: {runStatus}).
                </p>
              )}
              {approvalError ? (
                <p style={{ fontSize: '12px', color: 'var(--color-danger, #ef4444)', margin: 0 }}>{approvalError}</p>
              ) : null}
            </div>
          </div>
        </div>

      </div>

      {/* Human Approval Gate Modal */}
      {showApprovalModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '500px',
              width: '100%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Human Approval Gate Required
              </h3>
              <button onClick={() => setShowApprovalModal(false)} className="btn btn-ghost btn-xs">
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              <div>
                <strong>Action: </strong>Record human approval for <code>{repoName}</code> ({branchName})
              </div>
              <div>
                <strong>Evidence: </strong>Status moves WAITING_APPROVAL → DEPLOYED with an audit event. Optional GitHub merge only if requested.
              </div>
              <div>
                <strong>Risk Level: </strong>
                <span className="badge badge-warning" style={{ marginLeft: '6px' }}>HIGH (production gate)</span>
              </div>
              {approvalError ? (
                <div style={{ color: 'var(--color-danger, #ef4444)' }}>{approvalError}</div>
              ) : null}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => setShowApprovalModal(false)} className="btn btn-secondary btn-sm" disabled={approvalBusy}>
                Cancel
              </button>
              <button
                onClick={() => void handleApprove({ mergePullRequest: false })}
                className="btn btn-secondary btn-sm"
                disabled={approvalBusy}
              >
                Approve without merge
              </button>
              <button
                onClick={() => void handleApprove({ mergePullRequest: true })}
                className="btn btn-primary btn-sm"
                disabled={approvalBusy}
              >
                {approvalBusy ? 'Working…' : 'Approve & merge PR'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
