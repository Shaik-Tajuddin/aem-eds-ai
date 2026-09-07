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

export function mapDbProjectToUserProject(p: any): UserProject {
  const healthScoreMap: Record<string, number> = {
    HEALTHY: 98,
    DEGRADED: 65,
    CRITICAL: 30,
    UNKNOWN: 100,
  };
  return {
    id: p.id,
    name: p.name || 'Untitled EDS Project',
    description: p.description || '',
    sourceType: p.sourceType || 'EXISTING_WEBSITE',
    sourceUrl: p.sourceUrl || '',
    repo: p.repo || 'adobe/aem-boilerplate',
    branch: p.branch || 'main',
    aemEnvironment: p.aemEnvironment || '',
    aemAuthorUrl: p.aemAuthorUrl || '',
    aemAuthoringPath: p.aemAuthoringPath || '',
    llmProvider: p.llmProvider ? `${p.llmProvider}${p.llmModel ? ` (${p.llmModel})` : ''}` : 'Claude 3.5 Sonnet (Direct)',
    blocksCount: p.blocksCount ?? 4,
    healthScore: healthScoreMap[p.health] ?? 98,
    lastRunStatus: p.health === 'CRITICAL' ? 'FAILED' : 'PASSED',
    lastRunTime: p.lastRunAt ? new Date(p.lastRunAt).toLocaleDateString() : 'Active',
    createdAt: p.createdAt || new Date().toISOString(),
    isCustom: true,
  };
}

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

export function getProjectById(id: string): UserProject | null {
  const projects = getStoredProjects();
  const cleanId = id.startsWith('proj-') ? id.replace('proj-', '') : id;
  const found = projects.find((p) => p.id === id || p.id === cleanId || p.id === `proj-${id}`);
  return found || null;
}

export async function fetchProjectById(id: string): Promise<UserProject | null> {
  try {
    const res = await fetch(`/api/backend/projects/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.project) {
        return mapDbProjectToUserProject(data.project);
      }
    }
  } catch (err) {
    console.error(`Failed to fetch project ${id}:`, err);
  }
  return null;
}

export async function fetchLiveProjects(): Promise<UserProject[]> {
  try {
    const res = await fetch('/api/backend/projects');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.projects)) {
        const mapped = data.projects.map(mapDbProjectToUserProject);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
          window.dispatchEvent(new Event(PROJECT_EVENT));
        }
        return mapped;
      }
    }
  } catch (err) {
    console.error('Failed to fetch live projects from PostgreSQL backend:', err);
  }
  return getStoredProjects();
}

export function hasCustomProjects(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

export async function saveProject(formData: any): Promise<UserProject> {
  const payload = {
    name: formData.name || 'Untitled EDS Project',
    description: formData.description || 'Created via New Project Wizard',
    source: {
      type: formData.sourceType || 'EXISTING_WEBSITE',
      url: formData.sourceUrl || undefined,
    },
    github: {
      repository: formData.githubRepo || 'adobe/aem-boilerplate',
      defaultBranch: formData.githubBranch || 'main',
      token: formData.githubToken || undefined,
    },
    aem: (formData.aemAuthorUrl || formData.aemPreviewUrl || formData.aemEnvironment) ? {
      authorUrl: formData.aemAuthorUrl || undefined,
      previewUrl: formData.aemPreviewUrl || formData.aemEnvironment || undefined,
      environment: formData.aemEnvironment || 'production',
      authoringPath: formData.aemAuthoringPath || undefined,
    } : undefined,
    llm: formData.llmProvider ? {
      provider: formData.llmProvider,
      model: formData.llmModel || 'claude-3-5-sonnet',
      apiKey: formData.llmApiKey || undefined,
    } : undefined,
  };

  let newProject: UserProject;

  try {
    const res = await fetch('/api/backend/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      newProject = mapDbProjectToUserProject({
        ...data.project,
        repo: payload.github.repository,
        branch: payload.github.defaultBranch,
        sourceType: payload.source.type,
        sourceUrl: payload.source.url,
        aemEnvironment: payload.aem?.previewUrl,
        aemAuthorUrl: payload.aem?.authorUrl,
        aemAuthoringPath: payload.aem?.authoringPath,
        llmProvider: payload.llm?.provider,
      });
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('Backend project create failed, using client storage:', err);
    newProject = {
      id: `proj-${Date.now().toString(36)}`,
      name: formData.name || 'Untitled EDS Project',
      description: formData.description || 'Created via New Project Wizard',
      sourceType: formData.sourceType || 'EXISTING_WEBSITE',
      sourceUrl: formData.sourceUrl || '',
      repo: formData.githubRepo || 'adobe/aem-boilerplate',
      branch: formData.githubBranch || 'main',
      aemEnvironment: formData.aemPreviewUrl || '',
      aemAuthorUrl: formData.aemAuthorUrl || '',
      aemAuthoringPath: formData.aemAuthoringPath || '',
      llmProvider: formData.llmProvider || 'Claude 3.5 Sonnet',
      blocksCount: 0,
      healthScore: 100,
      lastRunStatus: 'IDLE',
      lastRunTime: 'Just now',
      createdAt: new Date().toISOString(),
      isCustom: true,
    };
  }

  if (typeof window !== 'undefined') {
    const current = getStoredProjects();
    const updated = [newProject, ...current.filter((p) => p.id !== newProject.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(PROJECT_EVENT));
  }

  return newProject;
}

export async function updateProject(id: string, formData: Partial<UserProject>): Promise<UserProject | null> {
  if (typeof window === 'undefined') return null;
  try {
    const current = getStoredProjects();
    const index = current.findIndex((p) => p.id === id);
    const existing = index !== -1 ? current[index] : null;

    const updated: UserProject = {
      ...(existing || {
        id,
        name: formData.name || 'EDS Project',
        description: '',
        sourceType: 'EXISTING_WEBSITE',
        repo: 'adobe/aem-boilerplate',
        branch: 'main',
        llmProvider: 'Claude 3.5 Sonnet',
        blocksCount: 4,
        healthScore: 98,
        lastRunStatus: 'PASSED',
        lastRunTime: 'Just now',
        createdAt: new Date().toISOString(),
        isCustom: true,
      }),
      ...formData,
      id,
    };

    if (index !== -1) {
      current[index] = updated;
    } else {
      current.push(updated);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event(PROJECT_EVENT));

    await fetch(`/api/backend/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    }).catch((e) => console.warn('PATCH to PostgreSQL backend:', e));

    return updated;
  } catch (e) {
    console.error('Failed to update project:', e);
    return null;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const cleanId = id.startsWith('proj-') ? id.replace('proj-', '') : id;
    const current = getStoredProjects();
    const updated = current.filter((p) => p.id !== id && p.id !== cleanId && p.id !== `proj-${id}`);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(PROJECT_EVENT));

    try {
      await fetch(`/api/backend/projects/${cleanId}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('DELETE from PostgreSQL backend:', e);
    }

    // Re-sync with backend to guarantee persistent deletion state
    await fetchLiveProjects();

    return true;
  } catch (e) {
    console.error('Failed to delete project:', e);
    return false;
  }
}

export function resetToDemoProjects(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  fetchLiveProjects();
}

export function useProjects() {
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);

  useEffect(() => {
    // 1. Initial hydrate from storage
    const initial = getStoredProjects();
    setProjects(initial);

    // 2. Fetch live from PostgreSQL
    fetchLiveProjects().then((live) => {
      if (Array.isArray(live)) {
        setProjects(live);
      }
    });

    const update = () => {
      const p = getStoredProjects();
      setProjects(p);
      setIsLiveMode(true);
    };

    window.addEventListener(PROJECT_EVENT, update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener(PROJECT_EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return { projects, isLiveMode, saveProject, updateProject, deleteProject, resetToDemoProjects };
}
