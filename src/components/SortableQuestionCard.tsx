import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, Trash2, Pencil } from 'lucide-react';
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
      className={`relative p-5 rounded-2xl border transition-all cursor-pointer ${
        isDragging ? 'opacity-50 shadow-2xl z-50' : ''
      } ${
        isSelected
          ? isAppLight
            ? 'bg-amber-50 border-amber-400 shadow-md ring-1 ring-amber-400/30'
            : 'bg-amber-500/10 border-amber-500/60 shadow-md'
          : isAppLight
          ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Question Stem & Details */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
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

        {/* Actions (Drag handle, Duplicate, Delete) */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            {...listeners}
            {...attributes}
            disabled={disabled}
            className={`p-2 rounded-xl transition-colors touch-none ${
              disabled
                ? 'opacity-30 cursor-default'
                : isAppLight
                ? 'bg-slate-100 text-slate-500 cursor-grab active:cursor-grabbing hover:bg-slate-200 hover:text-slate-800'
                : 'bg-slate-800 text-slate-400 cursor-grab active:cursor-grabbing hover:text-white'
            }`}
            title={disabled ? 'Drag disabled while searching' : 'Drag to reorder'}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className={`p-2 rounded-xl btn-icon ${
              isAppLight
                ? 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700'
                : 'bg-slate-800 text-slate-300 hover:text-indigo-400'
            }`}
            title="Edit Question"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onDuplicate}
            className={`p-2 rounded-xl btn-icon ${
              isAppLight
                ? 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700'
                : 'bg-slate-800 text-slate-300 hover:text-amber-400'
            }`}
            title="Duplicate Question"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className={`p-2 rounded-xl btn-icon ${
              isAppLight
                ? 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
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
