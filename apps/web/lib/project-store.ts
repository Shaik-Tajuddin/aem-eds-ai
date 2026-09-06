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

export const INITIAL_DEMO_PROJECTS: UserProject[] = [];

export function getStoredProjects(): UserProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to read stored projects:', e);
  }
  return [];
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
