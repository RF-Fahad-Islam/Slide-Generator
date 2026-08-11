import React from 'react';
import { MCQItem, Workspace } from '../../types';
import { EditableMCQCard } from './EditableMCQCard';
import { CheckCircle2 } from 'lucide-react';

interface ApprovedHistoryViewProps {
  workspace: Workspace;
  isAppLight: boolean;
  onUpdateApprovedItem: (item: MCQItem) => void;
  onUnapprove: (itemId: string) => void;
}

export const ApprovedHistoryView: React.FC<ApprovedHistoryViewProps> = ({
  workspace,
  isAppLight,
  onUpdateApprovedItem,
  onUnapprove,
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
            Permanent history for this workspace. Edit a card in place, or unapprove it to send it back to the review queue.
          </p>
        </div>
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
