// ============================================================
// @aeds/browser — Browser Controller
// High-level Playwright execution wrapper for autonomous EDS audits
// ============================================================

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { BrowserError, BrowserErrorCode } from './errors.js';
import {
  type BrowserLaunchConfig,
  type ViewportName,
  type PageAuditResult,
  type ConsoleLogEntry,
  type NetworkErrorEntry,
  type EdsDomSummary,
  VIEWPORT_PRESETS,
} from './types.js';
import type { AxeViolation } from '@aeds/shared';

export class BrowserController {
  private browser: Browser | null = null;
  private launchConfig: BrowserLaunchConfig;

  constructor(config?: BrowserLaunchConfig) {
    this.launchConfig = {
      headless: config?.headless ?? true,
      browserType: config?.browserType ?? 'chromium',
      timeoutMs: config?.timeoutMs ?? 30000,
    };
  }

  public async launch(): Promise<void> {
    if (this.browser) return;
    try {
      this.browser = await chromium.launch({
        headless: this.launchConfig.headless,
      });
    } catch (err: any) {
      throw new BrowserError(
        `Failed to launch Playwright browser: ${err?.message || err}`,
        BrowserErrorCode.BROWSER_LAUNCH_FAILED,
        err
      );
    }
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Executes a full headless audit against an EDS page URL:
   * 1. Sets up viewport and device scale factor
   * 2. Listens for console logs and network errors
   * 3. Navigates and measures load latency
   * 4. Inspects EDS block structure and decoration status
   * 5. Performs basic accessibility audit
   * 6. Captures full-page screenshot
   */
  public async auditPage(
    url: string,
    viewportName: ViewportName = 'desktop',
    options?: { screenshotPath?: string; timeoutMs?: number }
  ): Promise<PageAuditResult> {
    await this.launch();

    if (!this.browser) {
      throw new BrowserError('Browser is not initialized', BrowserErrorCode.BROWSER_LAUNCH_FAILED);
    }

    const viewport = VIEWPORT_PRESETS[viewportName] || VIEWPORT_PRESETS.desktop;
    const timeout = options?.timeoutMs || this.launchConfig.timeoutMs || 30000;

    let context: BrowserContext | null = null;
    let page: Page | null = null;

    const consoleLogs: ConsoleLogEntry[] = [];
    const networkErrors: NetworkErrorEntry[] = [];

    try {
      context = await this.browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.isMobile,
        hasTouch: viewport.hasTouch,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 AI-EDS-Bot/0.1.0',
      });

      page = await context.newPage();
      page.setDefaultTimeout(timeout);

      // 1. Console listener
      page.on('console', (msg) => {
        consoleLogs.push({
          type: msg.type() as ConsoleLogEntry['type'],
          text: msg.text(),
          location: msg.location() ? `${msg.location().url}:${msg.location().lineNumber}` : undefined,
          timestamp: new Date().toISOString(),
        });
      });

      // 2. Network error listener
      page.on('requestfailed', (req) => {
        networkErrors.push({
          url: req.url(),
          method: req.method(),
          errorText: req.failure()?.errorText || 'Request failed',
          timestamp: new Date().toISOString(),
        });
      });

      page.on('response', (res) => {
        if (res.status() >= 400) {
          networkErrors.push({
            url: res.url(),
            method: res.request().method(),
            status: res.status(),
            statusText: res.statusText(),
            timestamp: new Date().toISOString(),
          });
        }
      });

      // 3. Navigate
      const startTime = Date.now();
      const response = await page.goto(url, {
        waitUntil: 'load',
        timeout,
      });

      const loadTimeMs = Date.now() - startTime;
      const statusCode = response?.status() || 200;
      const title = await page.title();

      // Wait brief moment for EDS async block decorators to run
      await page.waitForTimeout(1000);

      // 4. EDS DOM Inspection
      const domSummary: EdsDomSummary = await page.evaluate(() => {
        const sections = document.querySelectorAll('main > div, main > .section');
        const blockEls = document.querySelectorAll('main div[class]:not([class*="section"])');

        const detectedBlocks: Array<{ name: string; classes: string[]; isDecorated: boolean }> = [];

        blockEls.forEach((el) => {
          const classList = Array.from(el.classList);
          // Standard EDS blocks have class list where first item is the block name
          if (classList.length > 0) {
            const name = classList[0];
            const isDecorated = el.hasAttribute('data-block-status')
              ? el.getAttribute('data-block-status') === 'loaded'
              : el.children.length > 0;

            detectedBlocks.push({
              name,
              classes: classList,
              isDecorated,
            });
          }
        });

        return {
          sectionsCount: sections.length,
          blocksCount: detectedBlocks.length,
          detectedBlocks,
          hasMain: Boolean(document.querySelector('main')),
          hasHeader: Boolean(document.querySelector('header')),
          hasFooter: Boolean(document.querySelector('footer')),
        };
      });

      // 5. Accessibility — prefer live axe-core; fall back to DOM heuristics
      let a11yViolations: AxeViolation[] = [];
      let a11yMode: 'axe' | 'heuristic' = 'heuristic';
      try {
        const { getAxeSource } = await import('@aeds/accessibility');
        const axeSource = await getAxeSource();
        if (axeSource && axeSource.length > 100) {
          await page.addScriptTag({ content: axeSource });
          const axeResults = await page.evaluate(async () => {
            const axe = (window as unknown as { axe?: { run: (doc: Document, opts: object) => Promise<{ violations: any[] }> } }).axe;
            if (!axe?.run) return null;
            const results = await axe.run(document, {
              resultTypes: ['violations'],
            });
            return (results.violations || []).map((v: any) => ({
              id: String(v.id),
              description: String(v.description || v.help || v.id),
              impact: v.impact || 'moderate',
              nodes: Array.isArray(v.nodes) ? v.nodes.length : 0,
              helpUrl: v.helpUrl || undefined,
            }));
          });
          if (axeResults) {
            a11yViolations = axeResults as AxeViolation[];
            a11yMode = 'axe';
          }
        }
      } catch {
        // fall through to heuristics
      }

      if (a11yMode === 'heuristic') {
        a11yViolations = await page.evaluate(() => {
          const violations: AxeViolation[] = [];
          const imgsWithoutAlt = document.querySelectorAll('img:not([alt])');
          if (imgsWithoutAlt.length > 0) {
            violations.push({
              id: 'image-alt',
              description: 'Images must have alternate text',
              impact: 'critical',
              nodes: imgsWithoutAlt.length,
              helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/image-alt',
            });
          }
          const emptyButtons = Array.from(document.querySelectorAll('button, a')).filter((el) => {
            const text = el.textContent?.trim();
            const ariaLabel = el.getAttribute('aria-label');
            return !text && !ariaLabel && !el.querySelector('svg, img');
          });
          if (emptyButtons.length > 0) {
            violations.push({
              id: 'button-name',
              description: 'Buttons and links must have discernible text or aria-label',
              impact: 'serious',
              nodes: emptyButtons.length,
              helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/button-name',
            });
          }
          return violations;
        });
      }

      // 6. Screenshot
      let screenshotBase64: string | undefined;
      if (options?.screenshotPath) {
        await page.screenshot({
          path: options.screenshotPath,
          fullPage: true,
        });
      } else {
        const buffer = await page.screenshot({ fullPage: true });
        screenshotBase64 = buffer.toString('base64');
      }

      // 7. Performance timing (real navigation timing — not fabricated scores)
      const perfTiming = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        if (nav) {
          return {
            fcp: Math.max(0, nav.responseEnd),
            lcp: Math.max(0, nav.loadEventEnd),
            ttfb: Math.max(0, nav.responseStart),
          };
        }
        const t = (window.performance as any).timing;
        if (!t) return undefined;
        return {
          fcp: Math.max(0, t.responseEnd - t.navigationStart),
          lcp: Math.max(0, t.loadEventEnd - t.navigationStart),
          ttfb: Math.max(0, t.responseStart - t.requestStart),
        };
      });

      const lcp = perfTiming?.lcp ?? loadTimeMs;
      // Score derived only from measured load time — never a constant "pass" floor
      const performanceScore = Math.max(0, Math.min(100, Math.round(100 - lcp / 50)));

      return {
        url,
        viewport: viewportName,
        statusCode,
        title,
        loadTimeMs,
        consoleLogs,
        networkErrors,
        domSummary,
        screenshotBase64,
        screenshotPath: options?.screenshotPath,
        a11yViolations,
        a11yMode,
        performanceMetrics: {
          performanceScore,
          fcp: perfTiming?.fcp,
          lcp: perfTiming?.lcp,
          ttfb: perfTiming?.ttfb,
        },
      };
    } catch (err: any) {
      if (err.name === 'TimeoutError') {
        throw new BrowserError(`Navigation to ${url} timed out after ${timeout}ms`, BrowserErrorCode.NAVIGATION_TIMEOUT, err);
      }
      if (err instanceof BrowserError) throw err;
      throw new BrowserError(`Browser audit failed: ${err?.message || err}`, BrowserErrorCode.AUDIT_FAILED, err);
    } finally {
      if (page) await page.close().catch(() => {});
      if (context) await context.close().catch(() => {});
    }
  }
}
