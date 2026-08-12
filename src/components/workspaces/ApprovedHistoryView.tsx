import React from 'react';
import { MCQItem, Workspace } from '../../types';
import { EditableMCQCard } from './EditableMCQCard';
import { CheckCircle2, Presentation } from 'lucide-react';

interface ApprovedHistoryViewProps {
  workspace: Workspace;
  isAppLight: boolean;
  onUpdateApprovedItem: (item: MCQItem) => void;
  onUnapprove: (itemId: string) => void;
  onCreateDeckFromApproved: (items: MCQItem[]) => void;
}

export const ApprovedHistoryView: React.FC<ApprovedHistoryViewProps> = ({
  workspace,
  isAppLight,
  onUpdateApprovedItem,
  onUnapprove,
  onCreateDeckFromApproved,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30">
        <div>
          <h3 className="text-base font-black text-emerald-500 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Step 3: Approved ({workspace.approvedItems.length})
          </h3>
          <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Permanent history for this workspace. Edit a card in place, or unapprove it to send it back to the review queue. Approved questions also auto-import into the Question Bank.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onCreateDeckFromApproved(workspace.approvedItems)}
          disabled={workspace.approvedItems.length === 0}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black shadow-lg transition-all cursor-pointer ${
            workspace.approvedItems.length === 0
              ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
          }`}
          title={workspace.approvedItems.length === 0 ? 'Approve at least one question to build a presentation' : 'Open a new Slide Studio presentation with all approved questions'}
        >
          <Presentation className="w-4 h-4 stroke-[2.5]" />
          <span>Create Presentation from all approved ({workspace.approvedItems.length}) →</span>
        </button>
      </div>

      {workspace.approvedItems.length === 0 ? (
        <div className={`text-center py-16 space-y-3 rounded-3xl border border-dashed ${isAppLight ? 'border-slate-300' : 'border-slate-700'}`}>
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 stroke-[1.5]" />
          <h4 className={`text-base font-bold ${isAppLight ? 'text-slate-700' : 'text-slate-200'}`}>Nothing approved yet</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Approve questions in Step 2 (Review & Select) to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {workspace.approvedItems.map((item, idx) => (
            <EditableMCQCard
              key={item.id}
              item={item}
              index={idx}
              isAppLight={isAppLight}
              mode="approved"
              onSave={onUpdateApprovedItem}
              onUnapprove={() => onUnapprove(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
