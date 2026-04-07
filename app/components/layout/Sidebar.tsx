'use client';

import { useState, useCallback } from 'react';
import { useApp } from '../AppProvider';
import LabelForm from '../labels/LabelForm';
import Modal from '../ui/Modal';
import GardenerModal from '../ui/GardenerModal';
import ContextMenu from '../ui/ContextMenu';
import ConfirmDialog from '../ui/ConfirmDialog';
import type { LabelKind, LabelWithCount, ObjectiveType } from '@/app/lib/types';

interface ContextMenuState {
  label: LabelWithCount;
  x: number;
  y: number;
}

interface SidebarProps {
  onSelect?: () => void;
}

export default function Sidebar({ onSelect }: SidebarProps) {
  const { state, dispatch, actions } = useApp();
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [labelFormKind, setLabelFormKind] = useState<LabelKind>('project');
  const [editingLabel, setEditingLabel] = useState<LabelWithCount | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<LabelWithCount | null>(null);
  const [showGardener, setShowGardener] = useState(false);
  const [showObjectiveForm, setShowObjectiveForm] = useState(false);
  const [objectiveFormType, setObjectiveFormType] = useState<ObjectiveType>('mission');
  const [objectiveTitle, setObjectiveTitle] = useState('');

  const scopes = state.labels.filter((l) => l.kind === 'scope');
  const projects = state.labels.filter((l) => l.kind === 'project');
  const missions = state.objectives.filter((o) => o.objectiveType === 'mission');
  const parkingLots = state.objectives.filter((o) => o.objectiveType === 'parking_lot');

  const activeScope = state.filters.scopeId;
  const activeProject = state.filters.projectId;
  const activeObjective = state.filters.objectiveId;
  const isOrphaned = state.filters.orphanedOnly;
  const isGeneralOnly = state.filters.generalOnly;
  const isAllTasks = !activeScope && !activeProject && !isGeneralOnly && !activeObjective && !isOrphaned;

  const handleAllTasksClick = () => {
    dispatch({
      type: 'SET_FILTERS',
      payload: { scopeId: null, projectId: null, objectiveId: null, orphanedOnly: false, generalOnly: false },
    });
    onSelect?.();
  };

  const handleObjectiveClick = (id: string) => {
    dispatch({
      type: 'SET_FILTERS',
      payload: { objectiveId: activeObjective === id ? null : id, scopeId: null, projectId: null, orphanedOnly: false, generalOnly: false },
    });
    onSelect?.();
  };

  const handleOrphanedClick = () => {
    dispatch({
      type: 'SET_FILTERS',
      payload: { orphanedOnly: !isOrphaned, objectiveId: null, scopeId: null, projectId: null, generalOnly: false },
    });
    onSelect?.();
  };

  const handleCreateObjective = async () => {
    if (!objectiveTitle.trim()) return;
    await actions.createObjective({ title: objectiveTitle.trim(), objectiveType: objectiveFormType });
    setObjectiveTitle('');
    setShowObjectiveForm(false);
  };

  const handleGeneralClick = () => {
    dispatch({
      type: 'SET_FILTERS',
      payload: { scopeId: null, projectId: null, generalOnly: true },
    });
    onSelect?.();
  };

  const handleScopeClick = (id: string) => {
    dispatch({
      type: 'SET_FILTERS',
      payload: { scopeId: activeScope === id ? null : id, projectId: null, generalOnly: false },
    });
    onSelect?.();
  };

  const handleProjectClick = (id: string) => {
    dispatch({
      type: 'SET_FILTERS',
      payload: { projectId: activeProject === id ? null : id, scopeId: null, generalOnly: false },
    });
    onSelect?.();
  };

  const handleCreateLabel = (kind: LabelKind) => {
    setLabelFormKind(kind);
    setEditingLabel(null);
    setShowLabelForm(true);
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, label: LabelWithCount) => {
    e.preventDefault();
    setContextMenu({ label, x: e.clientX, y: e.clientY });
  }, []);

  const handleEdit = (label: LabelWithCount) => {
    setLabelFormKind(label.kind);
    setEditingLabel(label);
    setShowLabelForm(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    await actions.deleteLabel(confirmDelete.id);
    setConfirmDelete(null);
  };

  return (
    <aside
      className="w-60 shrink-0 border-r overflow-y-auto p-4 flex flex-col gap-6"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      {/* Views */}
      <div className="flex flex-col gap-1">
        <button
          onClick={handleAllTasksClick}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors"
          style={{
            background: isAllTasks ? 'var(--color-bg-secondary)' : 'transparent',
            color: isAllTasks ? 'var(--color-text)' : 'var(--color-text-secondary)',
            fontWeight: isAllTasks ? 600 : 400,
          }}
        >
          <span>📥</span>
          All Tasks
        </button>
        <button
          onClick={handleGeneralClick}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors"
          style={{
            background: isGeneralOnly ? 'var(--color-bg-secondary)' : 'transparent',
            color: isGeneralOnly ? 'var(--color-text)' : 'var(--color-text-secondary)',
            fontWeight: isGeneralOnly ? 600 : 400,
          }}
        >
          <span>🧊</span>
          General
        </button>
        <button
          onClick={() => setShowGardener(true)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-indigo-50 group"
          style={{
            color: 'var(--color-primary)',
          }}
        >
          <span className="group-hover:animate-bounce">🧑‍🌾</span>
          Garden Review
        </button>
      </div>

      {/* Objectives */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Objectives
          </h2>
          <button
            onClick={() => setShowObjectiveForm(true)}
            className="text-xs px-1.5 py-0.5 rounded hover:opacity-80"
            style={{ color: 'var(--color-primary)' }}
          >
            + Add
          </button>
        </div>
        <ul className="flex flex-col gap-1">
          {missions.map((obj) => (
            <li key={obj.id}>
              <button
                onClick={() => handleObjectiveClick(obj.id)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors"
                style={{
                  background: activeObjective === obj.id ? 'var(--color-bg-secondary)' : 'transparent',
                  color: activeObjective === obj.id ? 'var(--color-text)' : 'var(--color-text-secondary)',
                }}
              >
                <span className="flex items-center gap-2">
                  <span>🎯</span>
                  {obj.title}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{obj.itemCount}</span>
              </button>
            </li>
          ))}
          {parkingLots.map((obj) => (
            <li key={obj.id}>
              <button
                onClick={() => handleObjectiveClick(obj.id)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors"
                style={{
                  background: activeObjective === obj.id ? 'var(--color-bg-secondary)' : 'transparent',
                  color: activeObjective === obj.id ? 'var(--color-text)' : 'var(--color-text-secondary)',
                }}
              >
                <span className="flex items-center gap-2">
                  <span>🅿️</span>
                  {obj.title}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{obj.itemCount}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              onClick={handleOrphanedClick}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors"
              style={{
                background: isOrphaned ? 'var(--color-bg-secondary)' : 'transparent',
                color: isOrphaned ? '#dc2626' : 'var(--color-text-muted)',
              }}
            >
              <span>⚠️</span>
              Unbound
            </button>
          </li>
        </ul>
      </div>

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
                onContextMenu={(e) => handleContextMenu(e, scope)}
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
                onContextMenu={(e) => handleContextMenu(e, project)}
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
        <Modal
          title={editingLabel ? `Edit ${labelFormKind === 'scope' ? 'Scope' : 'Project'}` : `New ${labelFormKind === 'scope' ? 'Scope' : 'Project'}`}
          onClose={() => { setShowLabelForm(false); setEditingLabel(null); }}
        >
          <LabelForm
            kind={labelFormKind}
            label={editingLabel ?? undefined}
            onClose={() => { setShowLabelForm(false); setEditingLabel(null); }}
          />
        </Modal>
      )}

      {contextMenu && (
        <ContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          items={[
            { label: 'Edit', onClick: () => handleEdit(contextMenu.label) },
            { label: 'Delete', onClick: () => setConfirmDelete(contextMenu.label), danger: true },
          ]}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${confirmDelete.kind === 'scope' ? 'Scope' : 'Project'}`}
          message={`Delete "${confirmDelete.name}"? Tasks with this label will lose it.`}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {showGardener && (
        <GardenerModal onClose={() => setShowGardener(false)} />
      )}

      {showObjectiveForm && (
        <Modal title="New Objective" onClose={() => { setShowObjectiveForm(false); setObjectiveTitle(''); }}>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={objectiveTitle}
              onChange={(e) => setObjectiveTitle(e.target.value)}
              placeholder="Objective title"
              className="w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-indigo-400"
              style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateObjective(); }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setObjectiveFormType('mission')}
                className="flex-1 px-3 py-1.5 text-sm rounded-md border transition-colors"
                style={{
                  borderColor: objectiveFormType === 'mission' ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: objectiveFormType === 'mission' ? 'var(--color-primary)' : 'transparent',
                  color: objectiveFormType === 'mission' ? '#ffffff' : 'var(--color-text-secondary)',
                }}
              >
                🎯 Mission
              </button>
              <button
                type="button"
                onClick={() => setObjectiveFormType('parking_lot')}
                className="flex-1 px-3 py-1.5 text-sm rounded-md border transition-colors"
                style={{
                  borderColor: objectiveFormType === 'parking_lot' ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: objectiveFormType === 'parking_lot' ? 'var(--color-primary)' : 'transparent',
                  color: objectiveFormType === 'parking_lot' ? '#ffffff' : 'var(--color-text-secondary)',
                }}
              >
                🅿️ Parking Lot
              </button>
            </div>
            <button
              onClick={handleCreateObjective}
              disabled={!objectiveTitle.trim()}
              className="px-4 py-1.5 text-sm rounded-md text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Create
            </button>
          </div>
        </Modal>
      )}
    </aside>
  );
}
