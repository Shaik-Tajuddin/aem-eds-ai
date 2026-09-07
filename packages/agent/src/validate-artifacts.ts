// ============================================================
// Shared EDS artifact validation (used by tool + BuildValidationAgent)
// ============================================================

export interface ArtifactFileInput {
  path: string;
  content: string;
}

export interface ArtifactValidationResult {
  passed: boolean;
  errors: string[];
  fileCount: number;
  blockJsCount: number;
  errorCount: number;
  summary: string;
}

export function validateEdsArtifacts(files: ArtifactFileInput[]): ArtifactValidationResult {
  const errors: string[] = [];
  const jsBlocks = files.filter((f) => f.path.startsWith('blocks/') && f.path.endsWith('.js'));

  if (files.length === 0) {
    errors.push('No generated files to build');
  }

  for (const file of jsBlocks) {
    if (!file.content.includes('export default function decorate')) {
      errors.push(`${file.path}: missing export default function decorate`);
    }
    if (/from\s+['"]react['"]|require\(['"]react['"]\)/.test(file.content)) {
      errors.push(`${file.path}: forbidden React dependency in EDS block`);
    }
  }

  for (const file of files.filter((f) => f.path.endsWith('.json'))) {
    try {
      JSON.parse(file.content);
    } catch {
      errors.push(`${file.path}: invalid JSON`);
    }
  }

  const passed = errors.length === 0;
  return {
    passed,
    errors,
    fileCount: files.length,
    blockJsCount: jsBlocks.length,
    errorCount: errors.length,
    summary: passed
      ? `Build validation passed for ${files.length} file(s), ${jsBlocks.length} block JS`
      : `Build validation failed: ${errors.join('; ')}`,
  };
}
