"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface Workspace {
  id: string;
  name: string;
  description?: string;
}

const STORAGE_KEY = "notenest-active-workspace";
const DEFAULT_WORKSPACE_ID = "default";

const MOCK_WORKSPACES: Workspace[] = [
  { id: "default", name: "Personal Notes", description: "Your personal workspace" },
  { id: "team-alpha", name: "Team Alpha", description: "Collaborative workspace for Team Alpha" },
  { id: "project-beta", name: "Project Beta", description: "Workspace for Project Beta" },
];

function readStoredWorkspaceId(): string {
  if (typeof window === "undefined") return DEFAULT_WORKSPACE_ID;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && MOCK_WORKSPACES.some(w => w.id === raw)) return raw;
  } catch {
    // ignore
  }
  return DEFAULT_WORKSPACE_ID;
}

interface WorkspaceContextValue {
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  setActiveWorkspace: (workspaceId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string>(DEFAULT_WORKSPACE_ID);

  useEffect(() => {
    setActiveWorkspaceIdState(readStoredWorkspaceId());
  }, []);

  const setActiveWorkspace = useCallback((workspaceId: string) => {
    if (MOCK_WORKSPACES.some(w => w.id === workspaceId)) {
      setActiveWorkspaceIdState(workspaceId);
      try {
        localStorage.setItem(STORAGE_KEY, workspaceId);
      } catch {
        // ignore
      }
    }
  }, []);

  const activeWorkspace = useMemo(() => {
    return MOCK_WORKSPACES.find(w => w.id === activeWorkspaceId) || MOCK_WORKSPACES[0];
  }, [activeWorkspaceId]);

  const value = useMemo<WorkspaceContextValue>(() => ({
    workspaces: MOCK_WORKSPACES,
    activeWorkspace,
    setActiveWorkspace
  }), [activeWorkspace, setActiveWorkspace]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return ctx;
}
