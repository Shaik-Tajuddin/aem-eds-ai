import { Job } from 'bullmq';
import { VisualTestJobData, VisualTestJobResult } from '@aeds/queue';
import { BrowserController, type ViewportName } from '@aeds/browser';
import { VisualComparator } from '@aeds/visual';
import { getDatabase, visualRuns } from '@aeds/database';

async function captureScreenshot(url: string, viewport: ViewportName): Promise<Buffer> {
  const controller = new BrowserController({ headless: true });
  try {
    const audit = await controller.auditPage(url, viewport);
    if (!audit.screenshotBase64) {
      throw new Error(`No screenshot captured for ${url} (${viewport})`);
    }
    return Buffer.from(audit.screenshotBase64, 'base64');
  } finally {
    await controller.close().catch(() => {});
  }
}

/**
 * Visual regression job processor.
 * Never fabricates a passing score — failures and unavailable baselines are reported honestly.
 */
export async function processVisualTestJob(
  job: Pick<Job<VisualTestJobData>, 'data' | 'updateProgress'>,
): Promise<VisualTestJobResult> {
  const { data } = job;
  const start = Date.now();
  const thresholdPercent = Math.round((1 - (data.tolerance ?? 0.05)) * 1000) / 10;
  const viewport = (data.viewports?.[0] || 'desktop') as ViewportName;

  let db: ReturnType<typeof getDatabase> | null = null;
  try {
    db = getDatabase();
  } catch {
    // offline
  }

  try {
    await job.updateProgress(10);
    const baseline = await captureScreenshot(data.baselineUrl, viewport);
    await job.updateProgress(45);
    const candidate = await captureScreenshot(data.candidateUrl, viewport);
    await job.updateProgress(70);

    const comparator = new VisualComparator();
    const result = await comparator.compare(baseline, candidate, {
      threshold: thresholdPercent,
      diffTolerance: data.tolerance ?? 0.05,
      generateDiffImage: true,
    });

    await job.updateProgress(100);
    const durationMs = Date.now() - start;

    if (db) {
      try {
        await db.insert(visualRuns).values({
          runId: data.runId,
          iteration: 1,
          score: result.score,
          threshold: thresholdPercent,
          passed: result.passed,
          referenceScreenshot: data.baselineUrl,
          implementationScreenshot: data.candidateUrl,
          differences: {
            viewport,
            diffPercentage: result.diffPercentage,
            diffPixels: result.diffPixels,
          },
        });
      } catch (err) {
        console.warn('[VisualWorker] DB insert warning:', err);
      }
    }

    return {
      runId: data.runId,
      matchScore: result.score,
      passed: result.passed,
      diffPixelsCount: result.diffPixels,
      durationMs,
    };
  } catch (err: unknown) {
    const durationMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);

    if (db) {
      try {
        await db.insert(visualRuns).values({
          runId: data.runId,
          iteration: 1,
          score: 0,
          threshold: thresholdPercent,
          passed: false,
          differences: { error: message },
        });
      } catch {
        // ignore
      }
    }

    return {
      runId: data.runId,
      matchScore: 0,
      passed: false,
      diffPixelsCount: 0,
      durationMs,
    };
  }
}
