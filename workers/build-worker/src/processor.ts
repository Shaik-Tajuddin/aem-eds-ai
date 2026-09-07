import { Job } from 'bullmq';
import { BuildJobData, BuildJobResult, runAllowlistedCommand } from '@aeds/queue';

export async function processBuildJob(
  job: Pick<Job<BuildJobData>, 'data' | 'updateProgress'>,
): Promise<BuildJobResult> {
  const { data } = job;
  const start = Date.now();
  const commands: BuildJobResult['commands'] = [];

  try {
    const list = data.commands?.length ? data.commands : ['npm run build:json'];
    for (let i = 0; i < list.length; i++) {
      const cmd = list[i]!;
      await job.updateProgress(Math.round(((i + 0.5) / list.length) * 100));
      const result = await runAllowlistedCommand(data.workDir, cmd, data.timeoutMs ?? 300_000);
      commands.push(result);
      if (result.exitCode !== 0) {
        return {
          runId: data.runId,
          success: false,
          commands,
          durationMs: Date.now() - start,
          error: `Command failed (${result.exitCode}): ${cmd}\n${result.stderr.slice(0, 2000)}`,
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
