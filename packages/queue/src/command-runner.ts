import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

export interface CommandResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

const ALLOWED_PREFIXES = ['npm run', 'npm test', 'npx ', 'node '];

export function assertSafeCommand(command: string): void {
  const trimmed = command.trim();
  if (!ALLOWED_PREFIXES.some((p) => trimmed.startsWith(p))) {
    throw new Error(
      `Command not allowlisted: "${command}". Allowed prefixes: ${ALLOWED_PREFIXES.join(', ')}`,
    );
  }
  if (/[;&|`$<>]/.test(trimmed) || trimmed.includes('..')) {
    throw new Error(`Command contains forbidden shell metacharacters: "${command}"`);
  }
}

export async function runAllowlistedCommand(
  workDir: string,
  command: string,
  timeoutMs: number,
): Promise<CommandResult> {
  assertSafeCommand(command);
  const cwd = resolve(workDir);
  const start = Date.now();
  const parts = command.trim().split(/\s+/);
  const bin = parts[0]!;
  const args = parts.slice(1);

  return new Promise((resolvePromise) => {
    const child = spawn(bin, args, {
      cwd,
      shell: false,
      env: { ...process.env, CI: 'true', FORCE_COLOR: '0' },
    });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      stderr += `\n[timeout after ${timeoutMs}ms]`;
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
      if (stdout.length > 200_000) stdout = stdout.slice(-200_000);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
      if (stderr.length > 200_000) stderr = stderr.slice(-200_000);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolvePromise({
        command,
        exitCode: code ?? 1,
        stdout,
        stderr,
        durationMs: Date.now() - start,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolvePromise({
        command,
        exitCode: 1,
        stdout,
        stderr: `${stderr}\n${err.message}`,
        durationMs: Date.now() - start,
      });
    });
  });
}
