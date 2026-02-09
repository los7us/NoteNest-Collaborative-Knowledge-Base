"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function WorkspaceSelector() {
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();

  return (
    <div className="flex items-center gap-2">
      <select
        value={activeWorkspace.id}
        onChange={(e) => setActiveWorkspace(e.target.value)}
        className="rounded-lg border px-3 py-1 text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{
          borderColor: "var(--color-border-light)",
          color: "var(--color-text-primary)",
          background: "var(--color-background)",
        }}
      >
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name}
          </option>
        ))}
      </select>
    </div>
  );
}
