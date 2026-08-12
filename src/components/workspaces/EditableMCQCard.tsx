import React, { useRef, useState } from 'react';
import { MCQItem, getSourceTags } from '../../types';
import { MathText } from '../MathText';
import { SourceTagsInput } from '../SourceTagsInput';
import { TagChipSelect } from '../TagChipSelect';
import { useTagMemory } from '../../hooks/useTagMemory';
import { MathHelperButton } from '../math/MathHelperButton';
import { CheckCircle2, Edit2, Check, Trash2, X, RotateCcw } from 'lucide-react';

interface EditableMCQCardProps {
  item: MCQItem;
  index: number;
  isAppLight: boolean;
  mode: 'select' | 'approved';
  selected?: boolean;
  onToggleSelect?: () => void;
  selectable?: boolean; // approved mode: opt-in card selection (checkbox + click-to-toggle)
  onSave: (item: MCQItem) => void;
  onRemove?: () => void; // mode === 'select' only
  onUnapprove?: () => void; // mode === 'approved' only
}

// Shared view/edit card for a single MCQ — used by both the Review Queue
// (click-to-select + bulk approve) and the Approved history view (edit +
// unapprove; opt-in selection via `selectable`). Edit state is local to the
// card so multiple cards never fight over a single "which one is being edited" id.
export const EditableMCQCard: React.FC<EditableMCQCardProps> = ({
  item,
  index,
  isAppLight,
  mode,
  selected = false,
  onToggleSelect,
  selectable = false,
  onSave,
  onRemove,
  onUnapprove,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<MCQItem | null>(null);
  const { memory, rememberItems } = useTagMemory();
  const stemRef = useRef<HTMLTextAreaElement>(null);
  const optionRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-amber-500 ${
    isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
  }`;

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft({
      ...item,
      options: item.options.map((o) => ({ ...o })),
      romanItems: item.romanItems ? [...item.romanItems] : undefined,
    });
    setIsEditing(true);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setDraft(null);
  };

  const saveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!draft || !draft.stem.trim()) return;
    rememberItems([draft]);
    onSave(draft);
    setIsEditing(false);
    setDraft(null);
  };

  const patchDraft = (patch: Partial<MCQItem>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const patchOption = (key: string, text: string) => {
    setDraft((prev) =>
      prev ? { ...prev, options: prev.options.map((o) => (o.key === key ? { ...o, text } : o)) } : prev
    );
  };

  const setAnswer = (key: string) => {
    setDraft((prev) =>
      prev ? { ...prev, answer: key, options: prev.options.map((o) => ({ ...o, isCorrect: o.key === key })) } : prev
    );
  };

  const isSelectable = mode === 'select' || selectable;

  const cardStateClass = isEditing
    ? isAppLight
      ? 'border-2 border-amber-400 ring-2 ring-amber-400/40 bg-amber-50/40'
      : 'border-2 border-amber-500/50 ring-1 ring-amber-500/30 bg-slate-950'
    : isSelectable && selected
    ? isAppLight
      ? 'bg-emerald-50 border-2 border-emerald-400 ring-2 ring-emerald-400/30 text-slate-950'
      : 'bg-emerald-500/10 border-2 border-emerald-500/60 ring-2 ring-emerald-400/40 text-slate-100'
    : isAppLight
    ? 'bg-white border-2 border-slate-300 text-slate-950 shadow-sm'
    : 'bg-slate-950 border-2 border-slate-700 text-slate-100 shadow-md';

  return (
    <div
      onClick={isSelectable && !isEditing ? onToggleSelect : undefined}
      className={`p-5 rounded-3xl space-y-3.5 transition-all ${cardStateClass} ${
        isSelectable && !isEditing ? 'cursor-pointer' : ''
      }`}
    >
      {isEditing && draft ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <span className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${isAppLight ? 'text-indigo-700' : 'text-indigo-300'}`}>
                <Edit2 className="w-3.5 h-3.5" />
                Editing Question (in place)
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={cancelEdit}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold border cursor-pointer transition-all ${
                  isAppLight ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/25 cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-[11px] font-bold mb-1 uppercase tracking-wider ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Question Stem
            </label>
            <div className="flex items-start gap-2">
              <textarea
                ref={stemRef}
                value={draft.stem}
                onChange={(e) => patchDraft({ stem: e.target.value })}
                rows={2}
                className={`${inputCls} resize-none leading-relaxed flex-1`}
              />
              <MathHelperButton
                value={draft.stem}
                onChange={(v) => patchDraft({ stem: v })}
                inputRef={stemRef}
                isAppLight={isAppLight}
                label="question stem"
                className="mt-1"
              />
            </div>
          </div>

          {draft.questionType === 'roman_statements' && (
            <div className={`space-y-2 p-3 rounded-2xl border ${isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <label className="block text-[11px] font-bold text-amber-500 uppercase tracking-wider">Roman Statements (i. ii. iii.)</label>
              {draft.romanItems && draft.romanItems.length > 0 ? (
                draft.romanItems.map((ri, riIdx) => (
                  <input
                    key={riIdx}
                    type="text"
                    value={ri}
                    onChange={(e) => {
                      const updated = [...(draft.romanItems || [])];
                      updated[riIdx] = e.target.value;
                      patchDraft({ romanItems: updated });
                    }}
                    className={inputCls}
                  />
                ))
              ) : (
                <input
                  type="text"
                  value=""
                  onChange={(e) => patchDraft({ romanItems: [e.target.value, '', ''] })}
                  placeholder="Add statement…"
                  className={inputCls}
                />
              )}
              <input
                type="text"
                value={draft.prompt || ''}
                onChange={(e) => patchDraft({ prompt: e.target.value })}
                placeholder="Prompt e.g. নিচের কোনটি সঠিক?"
                className={`${inputCls} ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {draft.options.map((opt) => {
              const isCorrect = opt.key.toLowerCase() === draft.answer?.toLowerCase();
              return (
                <div
                  key={opt.key}
                  className={`flex items-center gap-2 p-2 rounded-xl border ${
                    isCorrect ? 'bg-emerald-500/10 border-emerald-500/40' : isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">{opt.key}</span>
                  <input
                    ref={(el) => { optionRefs.current[opt.key] = el; }}
                    type="text"
                    value={opt.text}
                    onChange={(e) => patchOption(opt.key, e.target.value)}
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border text-sm focus:outline-none focus:border-amber-500 bg-transparent"
                  />
                  <MathHelperButton
                    value={opt.text}
                    onChange={(v) => patchOption(opt.key, v)}
                    inputRef={{ current: optionRefs.current[opt.key] ?? null }}
                    isAppLight={isAppLight}
                    label={`option ${opt.key}`}
                  />
                  <button
                    type="button"
                    onClick={() => setAnswer(opt.key)}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer shrink-0 ${
                      isCorrect ? 'bg-emerald-500 text-slate-950' : isAppLight ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isCorrect ? '✓ Correct' : 'Answer'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={`block text-[11px] font-bold mb-1 uppercase tracking-wider ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Source Tags (Board / Exam)
              </label>
              <SourceTagsInput
                tags={getSourceTags(draft)}
                onChange={(tags) => patchDraft({ source: tags.length > 0 ? tags : undefined })}
                theme={isAppLight ? 'light' : 'dark'}
              />
            </div>
            <div>
              <label className={`block text-[11px] font-bold mb-1 uppercase tracking-wider ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Explanation
              </label>
              <input
                type="text"
                value={draft.explanation || ''}
                onChange={(e) => patchDraft({ explanation: e.target.value || undefined })}
                placeholder="Optional explanation"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={`block text-[11px] font-bold mb-1 uppercase tracking-wider ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>Subject</label>
              <TagChipSelect
                value={draft.tags?.subject || ''}
                onChange={(v) => patchDraft({ tags: { ...(draft.tags || {}), subject: v || undefined } })}
                suggestions={memory.subjects}
                placeholder="e.g. Biology"
                theme={isAppLight ? 'light' : 'dark'}
              />
            </div>
            <div>
              <label className={`block text-[11px] font-bold mb-1 uppercase tracking-wider ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>Class</label>
              <TagChipSelect
                value={draft.tags?.className || ''}
                onChange={(v) => patchDraft({ tags: { ...(draft.tags || {}), className: v || undefined } })}
                suggestions={memory.classes}
                placeholder="e.g. SSC / HSC"
                theme={isAppLight ? 'light' : 'dark'}
              />
            </div>
            <div>
              <label className={`block text-[11px] font-bold mb-1 uppercase tracking-wider ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>Paper</label>
              <TagChipSelect
                value={draft.tags?.paper || ''}
                onChange={(v) => patchDraft({ tags: { ...(draft.tags || {}), paper: v || undefined } })}
                suggestions={memory.papers}
                placeholder="e.g. 1st Paper"
                theme={isAppLight ? 'light' : 'dark'}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {isSelectable ? (
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all ${
                    selected ? 'bg-emerald-500 text-white' : isAppLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {selected ? <Check className="w-4 h-4 stroke-[3]" /> : index + 1}
                </span>
              ) : mode === 'approved' ? (
                <span className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                  {index + 1}
                </span>
              ) : null}
              <div className="space-y-1">
                <h4 className={`text-base lg:text-lg font-black leading-relaxed ${isAppLight ? 'text-slate-950' : 'text-white'}`}>
                  <MathText text={item.stem} />
                </h4>

                {item.romanItems && item.romanItems.length > 0 && (
                  <div className={`my-2 p-3.5 rounded-2xl space-y-1.5 ${isAppLight ? 'bg-slate-100/70 text-slate-950' : 'bg-slate-900/70 text-slate-100'}`}>
                    {item.romanItems.map((stmt, sIdx) => (
                      <div key={sIdx} className="text-sm lg:text-base font-bold">
                        <MathText text={stmt} />
                      </div>
                    ))}
                    {item.prompt && (
                      <div className={`text-sm lg:text-base font-black italic pt-1 ${isAppLight ? 'text-amber-800' : 'text-amber-300'}`}>
                        <MathText text={item.prompt} />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-mono shadow-2xs">
                    ✓ Ans: {item.answer}
                  </span>
                  {getSourceTags(item).map((tag) => (
                    <span key={tag} className={`text-xs font-extrabold px-2.5 py-1 rounded-xl ${isAppLight ? 'bg-amber-100 text-amber-950' : 'bg-amber-500/20 text-amber-300'}`}>
                      {tag}
                    </span>
                  ))}
                  {item.tags?.subject && (
                    <span className={`text-xs font-extrabold px-2.5 py-1 rounded-xl font-mono ${isAppLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-slate-300'}`}>
                      📌 {item.tags.subject}
                    </span>
                  )}
                  {item.tags?.className && (
                    <span className={`text-xs font-extrabold px-2.5 py-1 rounded-xl font-mono ${isAppLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-slate-300'}`}>
                      🏫 {item.tags.className}
                    </span>
                  )}
                  {item.tags?.paper && (
                    <span className={`text-xs font-extrabold px-2.5 py-1 rounded-xl font-mono ${isAppLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-slate-300'}`}>
                      📄 {item.tags.paper}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={startEdit}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                  isAppLight ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                }`}
                title="Edit this question right here"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              {mode === 'select' && onRemove && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    isAppLight ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                  }`}
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {mode === 'approved' && onUnapprove && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnapprove();
                  }}
                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                    isAppLight ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  }`}
                  title="Move back to the review queue"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Unapprove</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-sm pt-2">
            {item.options.map((opt) => {
              const isCorrect = opt.isCorrect || opt.key.toLowerCase() === item.answer?.toLowerCase();
              return (
                <div
                  key={opt.key}
                  className={`p-3 rounded-2xl flex items-center gap-2.5 font-bold transition-colors ${
                    isCorrect
                      ? isAppLight
                        ? 'bg-emerald-500/15 text-emerald-950 ring-1 ring-emerald-500/30 shadow-2xs'
                        : 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30 shadow-2xs'
                      : isAppLight
                      ? 'bg-slate-100/80 text-slate-900'
                      : 'bg-slate-900/80 text-slate-100'
                  }`}
                >
                  <span className="w-6 h-6 rounded-lg bg-black/10 flex items-center justify-center shrink-0 text-xs font-black">{opt.key}</span>
                  <span className="min-w-0 truncate">
                    <MathText text={opt.text} />
                  </span>
                </div>
              );
            })}
          </div>

          {item.explanation && (
            <div className={`p-3 rounded-2xl text-sm border-2 ${isAppLight ? 'bg-sky-50 border-sky-300 text-sky-950' : 'bg-sky-500/10 border-sky-700/60 text-sky-200'}`}>
              <span className="font-black">Explanation: </span>
              <MathText text={item.explanation} />
            </div>
          )}
        </>
      )}
    </div>
  );
};
