'use client';

import { useState, useEffect } from 'react';

export interface UserProject {
  id: string;
  name: string;
  description: string;
  sourceType: string;
  sourceUrl?: string;
  repo: string;
  branch: string;
  aemEnvironment?: string;
  aemAuthorUrl?: string;
  aemAuthoringPath?: string;
  llmProvider: string;
  blocksCount: number;
  healthScore: number;
  lastRunStatus: 'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED';
  lastRunTime: string;
  createdAt: string;
  isCustom: boolean;
}

const STORAGE_KEY = 'aeds_user_projects';
const PROJECT_EVENT = 'aeds_projects_updated';

export const INITIAL_DEMO_PROJECTS: UserProject[] = [
  {
    id: 'proj-001',
    name: 'AEDS Core Boilerplate',
    description: 'Adobe Experience League official Edge Delivery Services boilerplate.',
    sourceType: 'FIGMA',
    sourceUrl: 'https://www.figma.com/file/demo/AEDS-Boilerplate',
    repo: 'adobe-experience-league/aeds-boilerplate',
    branch: 'main',
    aemEnvironment: 'aem-stage-east.adobeaemcloud.com',
    aemAuthorUrl: 'https://author-p12345-e67890.adobeaemcloud.com',
    aemAuthoringPath: '/content/experience-league/us/en',
    llmProvider: 'Claude 3.7 Sonnet (Hybrid)',
    blocksCount: 12,
    healthScore: 99,
    lastRunStatus: 'PASSED',
    lastRunTime: '18 mins ago',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    isCustom: false,
  },
  {
    id: 'proj-002',
    name: 'WKND Brand & Commerce EDS',
    description: 'High-speed headless commerce storefront built on EDS.',
    sourceType: 'EXISTING_WEBSITE',
    sourceUrl: 'https://wknd.site',
    repo: 'adobe-marketing/wknd-eds-storefront',
    branch: 'preview',
    aemEnvironment: 'wknd-prod.adobeaemcloud.com',
    aemAuthorUrl: 'https://author-p54321-e98765.adobeaemcloud.com',
    aemAuthoringPath: '/content/wknd/us/en',
    llmProvider: 'OpenAI GPT-4o',
    blocksCount: 8,
    healthScore: 98,
    lastRunStatus: 'PASSED',
    lastRunTime: '2 hours ago',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    isCustom: false,
  },
  {
    id: 'proj-003',
    name: 'Universal Design System Library',
    description: 'Design tokens and atomic block components.',
    sourceType: 'EXISTING_EDS_PROJECT',
    sourceUrl: 'https://github.com/adobe-design/eds-design-tokens',
    repo: 'adobe-design/eds-design-tokens',
    branch: 'develop',
    aemEnvironment: 'design-preview.adobeaemcloud.com',
    aemAuthorUrl: 'https://author-p11223-e44556.adobeaemcloud.com',
    aemAuthoringPath: '/content/eds-tokens/global/en',
    llmProvider: 'Ollama Llama 3.3 (Local)',
    blocksCount: 24,
    healthScore: 100,
    lastRunStatus: 'PASSED',
    lastRunTime: '5 hours ago',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    isCustom: false,
  },
];

export function getStoredProjects(): UserProject[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_PROJECTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_DEMO_PROJECTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to read stored projects:', e);
  }
  return INITIAL_DEMO_PROJECTS;
}

export function hasCustomProjects(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.some((p: UserProject) => p.isCustom);
  } catch {
    return false;
  }
}

export function saveProject(formData: any): UserProject {
  const newProject: UserProject = {
    id: `proj-${Date.now().toString(36)}`,
    name: formData.name || 'Untitled EDS Project',
    description: formData.description || 'Created via New Project Wizard',
    sourceType: formData.sourceType || 'FIGMA',
    sourceUrl: formData.sourceUrl || '',
    repo: formData.githubRepo || 'user/aem-eds-project',
    branch: formData.githubBranch || 'main',
    aemEnvironment: formData.aemPreviewUrl || formData.aemAuthorUrl || 'localhost:3000',
    aemAuthorUrl: formData.aemAuthorUrl || '',
    aemAuthoringPath: formData.aemAuthoringPath || '',
    llmProvider: formData.llmProvider ? `${formData.llmProvider} (${formData.llmModel || 'default'})` : 'Ollama Llama 3.3 (Local)',
    blocksCount: 0,
    healthScore: 100,
    lastRunStatus: 'IDLE',
    lastRunTime: 'Just now',
    createdAt: new Date().toISOString(),
    isCustom: true,
  };

  if (typeof window !== 'undefined') {
    try {
      // If previously only demo projects existed, start fresh with the new custom project!
      const current = getStoredProjects();
      const customOnly = current.filter((p) => p.isCustom);
      const updated = [newProject, ...customOnly];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(PROJECT_EVENT));
    } catch (e) {
      console.error('Failed to persist project:', e);
    }
  }

  // Also try POSTing to backend API if available
  if (typeof window !== 'undefined') {
    fetch('/api/backend/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newProject.name,
        description: newProject.description,
        source: { type: newProject.sourceType, url: newProject.sourceUrl },
        github: { repository: newProject.repo, defaultBranch: newProject.branch },
      }),
    }).catch(() => {
      // Backend not running; client persistence remains authoritative
    });
  }

  return newProject;
}

export function resetToDemoProjects(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(PROJECT_EVENT));
}

export function useProjects() {
  const [projects, setProjects] = useState<UserProject[]>(INITIAL_DEMO_PROJECTS);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      const p = getStoredProjects();
      setProjects(p);
      setIsLiveMode(p.some((item) => item.isCustom));
    };

    update();
    window.addEventListener(PROJECT_EVENT, update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener(PROJECT_EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return { projects, isLiveMode, saveProject, resetToDemoProjects };
}
