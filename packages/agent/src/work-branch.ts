/**
 * Build the Git work branch for an agent run: `ai-{project_name}`.
 * Sanitizes to a GitHub-safe branch / AEM preview subdomain segment.
 */
export function buildWorkBranchName(projectName: string): string {
  const slug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `ai-${slug || 'project'}`;
}
