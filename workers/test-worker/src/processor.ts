import { Job } from 'bullmq';
import { TestJobData, TestJobResult, runAllowlistedCommand } from '@aeds/queue';

export async function processTestJob(
  job: Pick<Job<TestJobData>, 'data' | 'updateProgress'>,
): Promise<TestJobResult> {
  const { data } = job;
  const start = Date.now();
  const commands: TestJobResult['commands'] = [];

  try {
    const list = data.commands?.length ? data.commands : ['npm test'];
    for (let i = 0; i < list.length; i++) {
      const cmd = list[i]!;
      await job.updateProgress(Math.round(((i + 0.5) / list.length) * 100));
      const result = await runAllowlistedCommand(data.workDir, cmd, data.timeoutMs ?? 600_000);
      commands.push(result);
      if (result.exitCode !== 0) {
        return {
          runId: data.runId,
          success: false,
          commands,
          durationMs: Date.now() - start,
          error: `Test command failed (${result.exitCode}): ${cmd}\n${result.stderr.slice(0, 2000)}`,
        };
      }
    }
    await job.updateProgress(100);
    return { runId: data.runId, success: true, commands, durationMs: Date.now() - start };
  } catch (err: unknown) {
    return {
      runId: data.runId,
      success: false,
      commands,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
