import React, { useState } from 'react';
import { MCQItem } from '../../types';
import { useWorkspaceSync } from '../../hooks/useWorkspaceSync';
import { approveItems, saveReviewQueue, unapproveItem, updateApprovedItem } from '../../utils/workspaceStore';
import { ManualEditor } from '../ManualEditor';
import { ApprovedHistoryView } from './ApprovedHistoryView';
import { ArrowLeft, FolderKanban, Check } from 'lucide-react';

interface WorkspaceEditorProps {
  workspaceId: string;
  onBack: () => void;
  appTheme: 'dark' | 'light';
}

export const WorkspaceEditor: React.FC<WorkspaceEditorProps> = ({ workspaceId, onBack, appTheme }) => {
  const isAppLight = appTheme === 'light';
  const { workspace, isLoaded, reload } = useWorkspaceSync(workspaceId);
  const [view, setView] = useState<'editor' | 'approved'>('editor');
  const [applyWorkspaceDefaultTags, setApplyWorkspaceDefaultTags] = useState(false);

  if (!isLoaded) return null;
  if (!workspace) {
    return (
      <div className={`rounded-3xl border p-8 text-center space-y-3 ${isAppLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
        <p className={`text-sm font-bold ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>Workspace not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Workspaces</span>
        </button>
      </div>
    );
  }

  const handleReviewQueueChange = async (next: MCQItem[]) => {
    await saveReviewQueue(workspace, next);
  };

  const handleApproveSelected = async (items: MCQItem[]) => {
    await approveItems(workspace, items);
    await reload();
  };

  const handleUpdateApprovedItem = async (item: MCQItem) => {
    await updateApprovedItem(workspace, item);
    await reload();
  };

  const handleUnapprove = async (itemId: string) => {
    await unapproveItem(workspace, itemId);
    await reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            title="Back to Workspaces"
            className={`p-2 rounded-xl cursor-pointer shrink-0 ${isAppLight ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shrink-0">
            <FolderKanban className="w-5 h-5 text-slate-950" />
          </div>
          <div className="min-w-0">
            <h1 className={`text-lg font-black truncate ${isAppLight ? 'text-slate-900' : 'text-white'}`}>{workspace.name}</h1>
            {workspace.description && (
              <p className={`text-xs truncate ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>{workspace.description}</p>
            )}
          </div>
        </div>

        {/* Editor (Paste & Review) vs Approved history — the outer guided stage;
            ManualEditor owns its own inner Step 1/2 stepper. */}
        <div className={`inline-flex items-center rounded-2xl border p-1 gap-1 ${isAppLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/40 border-slate-700/50'}`}>
          <button
            type="button"
            onClick={() => setView('editor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              view === 'editor'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                : isAppLight
                ? 'text-slate-600 hover:bg-slate-200'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span>Paste & Review</span>
            {workspace.reviewQueue.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${view === 'editor' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'}`}>
                {workspace.reviewQueue.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setView('approved')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              view === 'approved'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                : isAppLight
                ? 'text-slate-600 hover:bg-slate-200'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            {workspace.approvedItems.length > 0 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span>3</span>}
            <span>Approved</span>
            {workspace.approvedItems.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${view === 'approved' ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-500'}`}>
                {workspace.approvedItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {view === 'editor' ? (
        <ManualEditor
          key={workspace.id}
          appTheme={appTheme}
          reviewQueue={workspace.reviewQueue}
          onReviewQueueChange={handleReviewQueueChange}
          onApproveSelected={handleApproveSelected}
          defaultTags={workspace.defaultTags}
          applyWorkspaceDefaultTags={applyWorkspaceDefaultTags}
          onToggleApplyWorkspaceDefaultTags={() => setApplyWorkspaceDefaultTags((v) => !v)}
        />
      ) : (
        <ApprovedHistoryView
          workspace={workspace}
          isAppLight={isAppLight}
          onUpdateApprovedItem={handleUpdateApprovedItem}
          onUnapprove={handleUnapprove}
        />
      )}
    </div>
  );
};
