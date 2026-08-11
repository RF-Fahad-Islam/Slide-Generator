import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, Trash2, Pencil, ArrowUp, ArrowDown } from 'lucide-react';
import { MCQItem, getSourceTags } from '../types';
import { MathText } from './MathText';

interface SortableQuestionCardProps {
  item: MCQItem;
  index: number;
  isSelected: boolean;
  isAppLight: boolean;
  disabled: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const SortableQuestionCard: React.FC<SortableQuestionCardProps> = ({
  item,
  index,
  isSelected,
  isAppLight,
  disabled,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer ${
        isDragging ? 'opacity-50 shadow-2xl z-50' : ''
      } ${
        isSelected
          ? isAppLight
            ? 'bg-amber-50/90 border-amber-500 shadow-xl ring-2 ring-amber-400/40'
            : 'bg-slate-900/90 border-amber-500/90 shadow-2xl shadow-amber-500/10 ring-2 ring-amber-500/40'
          : isAppLight
          ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Question Stem & Details */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold leading-snug">
              <MathText text={item.stem} />
            </h4>

            {/* Source & Type badge */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {getSourceTags(item).map((tag) => (
                <span
                  key={tag}
                  className={`text-[11px] px-2.5 py-1 rounded-full border font-bold ${
                    isAppLight
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                  }`}
                >
                  {tag}
                </span>
              ))}
              <span
                className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${
                  isAppLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Answer: {item.answer}
              </span>
              {item.questionType === 'roman_statements' && (
                <span
                  className={`text-[11px] px-2.5 py-1 rounded-full border font-bold ${
                    isAppLight
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                      : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                  }`}
                >
                  Bohupodi
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions (Move Up, Move Down, Duplicate, Delete) */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {onMoveUp && (
            <button
              onClick={onMoveUp}
              className={`p-1.5 rounded-lg transition-colors ${
                isAppLight
                  ? 'text-slate-400 hover:bg-slate-200 hover:text-slate-800'
                  : 'text-slate-500 hover:bg-slate-800 hover:text-white'
              }`}
              title="Move Up"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={onMoveDown}
              className={`p-1.5 rounded-lg transition-colors ${
                isAppLight
                  ? 'text-slate-400 hover:bg-slate-200 hover:text-slate-800'
                  : 'text-slate-500 hover:bg-slate-800 hover:text-white'
              }`}
              title="Move Down"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onDuplicate}
            className={`p-1.5 rounded-lg transition-colors ${
              isAppLight
                ? 'text-slate-400 hover:bg-amber-100 hover:text-amber-700'
                : 'text-slate-500 hover:bg-slate-800 hover:text-amber-400'
            }`}
            title="Duplicate Question"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className={`p-1.5 rounded-lg transition-colors ${
              isAppLight
                ? 'text-rose-400 hover:bg-rose-100 hover:text-rose-600'
                : 'text-slate-500 hover:bg-rose-500/20 hover:text-rose-400'
            }`}
            title="Delete Question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
