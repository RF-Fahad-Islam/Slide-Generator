import React, { useState } from 'react';
import { Workspace } from '../../types';
import { FolderKanban, PenLine, Trash2, Tag } from 'lucide-react';

interface WorkspaceCardProps {
  workspace: Workspace;
  isAppLight: boolean;
  onOpen: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({ workspace, isAppLight, onOpen, onRename, onDelete }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(workspace.name);

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNameDraft(workspace.name);
    setIsEditingName(true);
  };

  const commitName = () => {
    setIsEditingName(false);
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== workspace.name) onRename(trimmed);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const approvedCount = workspace.approvedItems.length;
    const confirmed = window.confirm(
      `Delete "${workspace.name}"? This permanently removes its review queue and all ${approvedCount} approved question(s) — they will also disappear from the Question Bank's approved pool. Any presentation decks you already built from them stay as-is.`
    );
    if (confirmed) onDelete();
  };

  const tagsSummary = [workspace.defaultTags?.subject, workspace.defaultTags?.className, workspace.defaultTags?.paper]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      onClick={onOpen}
      className={`p-5 rounded-3xl border cursor-pointer transition-all space-y-4 group ${
        isAppLight
          ? 'bg-white border-slate-200 hover:border-amber-400 shadow-sm'
          : 'bg-slate-950 border-slate-800 hover:border-amber-500/50 shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shrink-0">
            <FolderKanban className="w-5 h-5 text-slate-950" />
          </div>
          <div className="min-w-0 flex-1">
            {isEditingName ? (
              <input
                autoFocus
                value={nameDraft}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                className={`w-full text-sm font-black rounded-lg px-2 py-1 border outline-none ${
                  isAppLight ? 'bg-white border-amber-300 text-slate-900' : 'bg-slate-900 border-amber-500/50 text-white'
                }`}
              />
            ) : (
              <h3 className={`text-sm font-black truncate ${isAppLight ? 'text-slate-900' : 'text-white'}`}>{workspace.name}</h3>
            )}
            {workspace.description && (
              <p className={`text-xs mt-0.5 line-clamp-2 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>{workspace.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={startEditing}
            title="Rename workspace"
            className={`p-1.5 rounded-lg cursor-pointer ${isAppLight ? 'text-slate-400 hover:text-amber-600 hover:bg-slate-100' : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'}`}
          >
            <PenLine className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            title="Delete workspace"
            className={`p-1.5 rounded-lg cursor-pointer ${isAppLight ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10'}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
          isAppLight ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        }`}>
          {workspace.reviewQueue.length} pending
        </span>
        <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
          isAppLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        }`}>
          {workspace.approvedItems.length} approved
        </span>
      </div>

      {tagsSummary && (
        <div className={`flex items-center gap-1.5 text-[11px] font-bold ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
          <Tag className="w-3 h-3" />
          <span className="truncate">{tagsSummary}</span>
        </div>
      )}
    </div>
  );
};
