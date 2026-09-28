/** Expose axe-core source for Playwright page.addScriptTag / evaluate injection */
export async function getAxeSource(): Promise<string> {
  try {
    const axe = await import('axe-core');
    const fromExport =
      typeof (axe as any).source === 'string'
        ? (axe as any).source
        : typeof (axe as any).default?.source === 'string'
          ? (axe as any).default.source
          : '';
    if (fromExport.length > 100) return fromExport;
  } catch {
    // fall through to filesystem
  }

  try {
    const { createRequire } = await import('node:module');
    const { readFileSync } = await import('node:fs');
    const path = await import('node:path');
    const req = createRequire(path.resolve('package.json'));
    const axePath = req.resolve('axe-core/axe.min.js');
    return readFileSync(axePath, 'utf8');
  } catch {
    return '';
  }
}
