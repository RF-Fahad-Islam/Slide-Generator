import React, { useState } from 'react';
import { DeckConfig, MCQItem, Workspace } from '../../types';
import { EditableMCQCard } from './EditableMCQCard';
import { CreateDeckFromApprovedModal } from './CreateDeckFromApprovedModal';
import { CheckCircle2, Presentation, CheckCheck, X } from 'lucide-react';

interface ApprovedHistoryViewProps {
  workspace: Workspace;
  isAppLight: boolean;
  onUpdateApprovedItem: (item: MCQItem) => void;
  onUnapprove: (itemId: string) => void;
  onCreateDeckFromApproved: (items: MCQItem[], overrides: Partial<DeckConfig>) => void;
}

export const ApprovedHistoryView: React.FC<ApprovedHistoryViewProps> = ({
  workspace,
  isAppLight,
  onUpdateApprovedItem,
  onUnapprove,
  onCreateDeckFromApproved,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);

  const approvedCount = workspace.approvedItems.length;
  const selectedItems = workspace.approvedItems.filter((i) => selectedIds.has(i.id));
  const selectedCount = selectedItems.length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(workspace.approvedItems.map((i) => i.id)));
  const clearSelection = () => setSelectedIds(new Set());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30">
        <div>
          <h3 className="text-base font-black text-emerald-500 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Step 3: Approved ({approvedCount})
          </h3>
          <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Select the cards you want in your deck, then create a presentation. Approved questions also auto-import into the Question Bank.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {approvedCount > 0 && (
            <button
              type="button"
              onClick={selectedCount === approvedCount ? clearSelection : selectAll}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-colors ${
                isAppLight ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
              title={selectedCount === approvedCount ? 'Clear all selections' : 'Select every approved card'}
            >
              {selectedCount === approvedCount ? <X className="w-3.5 h-3.5" /> : <CheckCheck className="w-3.5 h-3.5" />}
              <span>{selectedCount === approvedCount ? 'Clear all' : 'Select all'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsDeckModalOpen(true)}
            disabled={selectedCount === 0}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black shadow-lg transition-all cursor-pointer ${
              selectedCount === 0
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
            }`}
            title={selectedCount === 0 ? 'Check at least one approved card to build a presentation' : 'Open a new Slide Studio presentation with the selected approved questions'}
          >
            <Presentation className="w-4 h-4 stroke-[2.5]" />
            <span>Create Presentation ({selectedCount}) →</span>
          </button>
        </div>
      </div>

      {approvedCount === 0 ? (
        <div className={`text-center py-16 space-y-3 rounded-3xl border border-dashed ${isAppLight ? 'border-slate-300' : 'border-slate-700'}`}>
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 stroke-[1.5]" />
          <h4 className={`text-base font-bold ${isAppLight ? 'text-slate-700' : 'text-slate-200'}`}>Nothing approved yet</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Approve questions in Step 2 (Review & Select) to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedCount > 0 && (
            <p className={`text-[11px] font-bold px-1 ${isAppLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              {selectedCount} of {approvedCount} selected — click a card to toggle it.
            </p>
          )}
          {workspace.approvedItems.map((item, idx) => (
            <EditableMCQCard
              key={item.id}
              item={item}
              index={idx}
              isAppLight={isAppLight}
              mode="approved"
              selectable
              selected={selectedIds.has(item.id)}
              onToggleSelect={() => toggleSelect(item.id)}
              onSave={onUpdateApprovedItem}
              onUnapprove={() => onUnapprove(item.id)}
            />
          ))}
        </div>
      )}

      {isDeckModalOpen && (
        <CreateDeckFromApprovedModal
          workspace={workspace}
          count={selectedCount}
          isAppLight={isAppLight}
          onClose={() => setIsDeckModalOpen(false)}
          onConfirm={(overrides) => {
            onCreateDeckFromApproved(selectedItems, overrides);
            setIsDeckModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
