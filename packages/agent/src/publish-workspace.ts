// ============================================================
// @aeds/agent — Local publish workspace
// Clone → write generated files → npm run build:json + lint:fix → collect diff
// ============================================================

import { mkdtemp, writeFile, mkdir, rm, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawn } from 'node:child_process';
import { simpleGit } from 'simple-git';
import type { GeneratedFile } from './agents/base.js';
import { applyStylelintResidualFixes } from './stylelint-autofix.js';

export interface PublishWorkspaceResult {
  ok: boolean;
  workDir?: string;
  files: GeneratedFile[];
  buildJsonLog?: string;
  lintFixLog?: string;
  error?: string;
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
  timeoutMs = 10 * 60 * 1000,
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env,
      shell: process.platform === 'win32',
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      stderr += `\n[timeout after ${timeoutMs}ms]`;
    }, timeoutMs);
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, stdout, stderr });
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ code: 1, stdout, stderr: `${stderr}\n${err.message}` });
    });
  });
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function commandLog(result: { stdout: string; stderr: string; code: number }, max = 6000): string {
  const combined = `${result.stdout || ''}\n${result.stderr || ''}`.trim();
  const tail = combined.slice(-max);
  return `exit=${result.code}\n${tail || '(no npm output captured)'}`;
}

async function npmInstallWithRetry(
  npmCmd: string,
  workDir: string,
  env: NodeJS.ProcessEnv,
  log: (message: string, level?: 'info' | 'warn' | 'error') => void,
): Promise<{ code: number; stdout: string; stderr: string }> {
  const args = ['install', '--ignore-scripts', '--no-audit', '--no-fund'];
  let install = await runCommand(npmCmd, args, workDir, env, 15 * 60 * 1000);
  if (install.code === 0) return install;

  log(
    `npm install failed (exit ${install.code}) — retrying with --legacy-peer-deps…`,
    'warn',
  );
  install = await runCommand(
    npmCmd,
    [...args, '--legacy-peer-deps'],
    workDir,
    env,
    15 * 60 * 1000,
  );
  return install;
}

async function writeGeneratedFiles(workDir: string, files: Map<string, GeneratedFile>): Promise<void> {
  for (const file of files.values()) {
    if (file.operation === 'delete') continue;
    const abs = join(workDir, file.path);
    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, file.content, 'utf8');
  }
}

async function collectChangedFiles(workDir: string): Promise<GeneratedFile[]> {
  const git = simpleGit(workDir);
  const untrackedRaw = await git.raw(['ls-files', '--others', '--exclude-standard']);
  const modifiedRaw = await git.diff(['--name-only']);
  const deletedRaw = await git.diff(['--name-only', '--diff-filter=D']);

  const untracked = untrackedRaw
    .split(/\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const modified = modifiedRaw
    .split(/\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const deleted = new Set(
    deletedRaw
      .split(/\r?\n/)
      .map((p) => p.trim())
      .filter(Boolean),
  );

  const out: GeneratedFile[] = [];
  const seen = new Set<string>();

  for (const rel of [...untracked, ...modified]) {
    const norm = rel.replace(/\\/g, '/');
    if (!norm || seen.has(norm) || deleted.has(rel)) continue;
    seen.add(norm);
    const abs = join(workDir, rel);
    if (!(await pathExists(abs))) continue;
    const content = await readFile(abs, 'utf8');
    out.push({
      path: norm,
      content,
      operation: untracked.includes(rel) ? 'create' : 'modify',
    });
  }

  for (const rel of deleted) {
    const norm = rel.replace(/\\/g, '/');
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    out.push({ path: norm, content: '', operation: 'delete' });
  }

  return out;
}

/**
 * Prepares a local clone, applies generated files, runs EDS quality scripts,
 * and returns the full set of files that should be committed (including script outputs).
 */
export async function preparePublishWorkspace(options: {
  owner: string;
  repo: string;
  baseBranch: string;
  workBranch: string;
  token: string;
  generatedFiles: Map<string, GeneratedFile>;
  log?: (message: string, level?: 'info' | 'warn' | 'error') => void;
}): Promise<PublishWorkspaceResult> {
  const log = options.log || (() => undefined);
  let workDir: string | undefined;

  try {
    workDir = await mkdtemp(join(tmpdir(), 'aeds-publish-'));
    const authCloneUrl = `https://x-access-token:${options.token}@github.com/${options.owner}/${options.repo}.git`;

    log(`Cloning ${options.owner}/${options.repo}@${options.baseBranch} for pre-push checks…`);
    const git = simpleGit();
    await git.clone(authCloneUrl, workDir, [
      '--branch',
      options.baseBranch,
      '--single-branch',
      '--depth',
      '1',
    ]);

    const repoGit = simpleGit(workDir);
    // Detach remote URL credentials from logs / leftover config where possible
    await repoGit.raw(['remote', 'set-url', 'origin', `https://github.com/${options.owner}/${options.repo}.git`]);
    await repoGit.checkoutLocalBranch(options.workBranch);

    await writeGeneratedFiles(workDir, options.generatedFiles);
    log(`Wrote ${options.generatedFiles.size} generated file(s) into workspace`);

    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const env = {
      ...process.env,
      // Avoid husky / interactive prompts in CI-like clone
      HUSKY: '0',
      CI: '1',
      npm_config_fund: 'false',
      npm_config_audit: 'false',
    };

    log('Running npm install (required for build:json / lint:fix)…');
    const install = await npmInstallWithRetry(npmCmd, workDir, env, log);
    if (install.code !== 0) {
      return {
        ok: false,
        workDir,
        files: [],
        error: `npm install failed:\n${commandLog(install)}`,
      };
    }

    log('Running npm run build:json…');
    const buildJson = await runCommand(npmCmd, ['run', 'build:json'], workDir, env);
    if (buildJson.code !== 0) {
      return {
        ok: false,
        workDir,
        files: [],
        buildJsonLog: `${buildJson.stdout}\n${buildJson.stderr}`.trim(),
        error: `npm run build:json failed:\n${commandLog(buildJson)}`,
      };
    }
    log('build:json passed');

    log('Running npm run lint:fix…');
    const publishDir = workDir;
    let lintFix = await runCommand(npmCmd, ['run', 'lint:fix'], publishDir, env);
    let lintLog = `${lintFix.stdout}\n${lintFix.stderr}`.trim();

    // stylelint --fix cannot rewrite no-descending-specificity; apply residual fixes + retry
    const maxLintRetries = Math.max(1, Number(process.env.PUBLISH_LINT_FIX_RETRIES || 3));
    for (let attempt = 1; lintFix.code !== 0 && attempt <= maxLintRetries; attempt++) {
      log(`lint:fix reported issues — applying residual stylelint auto-fixes (attempt ${attempt}/${maxLintRetries})…`);
      const residual = await applyStylelintResidualFixes(
        publishDir,
        lintLog,
        (abs) => readFile(abs, 'utf8'),
        (abs, content) => writeFile(abs, content, 'utf8'),
        (rel) => join(publishDir, rel),
      );
      for (const note of residual.notes) {
        log(note, note.startsWith('Could not') ? 'warn' : 'info');
      }
      if (residual.fixedFiles.length === 0) {
        log('No residual stylelint auto-fixes applied — stopping retries.', 'warn');
        break;
      }
      log(`Re-running lint:fix after fixing: ${residual.fixedFiles.join(', ')}`);
      lintFix = await runCommand(npmCmd, ['run', 'lint:fix'], publishDir, env);
      lintLog = `${lintFix.stdout}\n${lintFix.stderr}`.trim();
    }

    if (lintFix.code !== 0) {
      return {
        ok: false,
        workDir,
        files: [],
        buildJsonLog: `${buildJson.stdout}\n${buildJson.stderr}`.trim(),
        lintFixLog: lintLog,
        error: `npm run lint:fix failed:\n${lintLog.slice(-4000)}`,
      };
    }
    log('lint:fix passed');

    const files = await collectChangedFiles(workDir);
    if (files.length === 0) {
      return {
        ok: false,
        workDir,
        files: [],
        buildJsonLog: `${buildJson.stdout}\n${buildJson.stderr}`.trim(),
        lintFixLog: lintLog,
        error: 'Pre-push checks passed but no file changes were detected to commit.',
      };
    }

    return {
      ok: true,
      workDir,
      files,
      buildJsonLog: `${buildJson.stdout}\n${buildJson.stderr}`.trim(),
      lintFixLog: lintLog,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, workDir, files: [], error: message };
  }
}

export async function cleanupPublishWorkspace(workDir?: string): Promise<void> {
  if (!workDir) return;
  try {
    await rm(workDir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
}
