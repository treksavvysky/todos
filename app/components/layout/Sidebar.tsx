'use client';

import { useState } from 'react';
import { useApp } from '../AppProvider';
import LabelForm from '../labels/LabelForm';
import type { LabelKind } from '@/app/lib/types';

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [labelFormKind, setLabelFormKind] = useState<LabelKind>('project');

  const scopes = state.labels.filter((l) => l.kind === 'scope');
  const projects = state.labels.filter((l) => l.kind === 'project');

  const activeScope = state.filters.scopeId;
  const activeProject = state.filters.projectId;

  const handleScopeClick = (id: string) => {
    dispatch({
      type: 'SET_FILTERS',
      payload: { scopeId: activeScope === id ? null : id, projectId: null },
    });
  };

  const handleProjectClick = (id: string) => {
    dispatch({
      type: 'SET_FILTERS',
      payload: { projectId: activeProject === id ? null : id, scopeId: null },
    });
  };

  const handleCreateLabel = (kind: LabelKind) => {
    setLabelFormKind(kind);
    setShowLabelForm(true);
  };

  return (
    <aside
      className="w-60 shrink-0 border-r overflow-y-auto p-4 flex flex-col gap-6"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      {/* Scopes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Scopes
          </h2>
          <button
            onClick={() => handleCreateLabel('scope')}
            className="text-xs px-1.5 py-0.5 rounded hover:opacity-80"
            style={{ color: 'var(--color-primary)' }}
          >
            + Add
          </button>
        </div>
        <ul className="flex flex-col gap-1">
          {scopes.map((scope) => (
            <li key={scope.id}>
              <button
                onClick={() => handleScopeClick(scope.id)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors"
                style={{
                  background: activeScope === scope.id ? 'var(--color-bg-secondary)' : 'transparent',
                  color: activeScope === scope.id ? 'var(--color-text)' : 'var(--color-text-secondary)',
                }}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: scope.color }}
                  />
                  {scope.name}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {scope.taskCount}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Projects
          </h2>
          <button
            onClick={() => handleCreateLabel('project')}
            className="text-xs px-1.5 py-0.5 rounded hover:opacity-80"
            style={{ color: 'var(--color-primary)' }}
          >
            + Add
          </button>
        </div>
        <ul className="flex flex-col gap-1">
          {projects.map((project) => (
            <li key={project.id}>
              <button
                onClick={() => handleProjectClick(project.id)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors"
                style={{
                  background: activeProject === project.id ? 'var(--color-bg-secondary)' : 'transparent',
                  color: activeProject === project.id ? 'var(--color-text)' : 'var(--color-text-secondary)',
                }}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {project.taskCount}
                </span>
              </button>
            </li>
          ))}
          {projects.length === 0 && (
            <li className="text-xs px-2 py-1" style={{ color: 'var(--color-text-muted)' }}>
              No projects yet
            </li>
          )}
        </ul>
      </div>

      {showLabelForm && (
        <LabelForm
          kind={labelFormKind}
          onClose={() => setShowLabelForm(false)}
        />
      )}
    </aside>
  );
}
