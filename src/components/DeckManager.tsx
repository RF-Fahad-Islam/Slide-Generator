import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { MCQItem, getSourceTags } from '../types';
import { SlideRef } from '../utils/answerSlides';
import { ValidationPanel } from './ValidationPanel';
import { AddQuestionsBanner } from './AddQuestionsBanner';
import { Search, CheckCircle2, Layers } from 'lucide-react';
import { SortableQuestionCard } from './SortableQuestionCard';

interface DeckManagerProps {
  items: MCQItem[];
  slides?: SlideRef[];
  onUpdateItems: (items: MCQItem[]) => void;
  onSelectIndex: (index: number) => void;
  onSelectPhysicalSlide?: (physicalIndex: number) => void;
  selectedIndex: number;
  appTheme?: 'dark' | 'light';
  onEditQuestion?: (item: MCQItem) => void;
  onAddQuestions?: () => void;
}

export const DeckManager: React.FC<DeckManagerProps> = ({
  items,
  slides,
  onUpdateItems,
  onSelectIndex,
  onSelectPhysicalSlide,
  selectedIndex,
  appTheme = 'dark',
  onEditQuestion,
  onAddQuestions,
}) => {
  const isAppLight = appTheme === 'light';
  const [searchQuery, setSearchQuery] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Move item from one position to another
  const moveItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    onUpdateItems(updated);
    onSelectIndex(toIdx);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        moveItem(oldIndex, newIndex);
      }
    }
  };

  const deleteItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    onUpdateItems(updated);
    if (selectedIndex >= updated.length) {
      onSelectIndex(Math.max(0, updated.length - 1));
    }
  };

  const duplicateItem = (item: MCQItem, idx: number) => {
    const copyItem: MCQItem = {
      ...item,
      id: `mcq_copy_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      stem: `${item.stem} (Copy)`,
    };
    const updated = [...items];
    updated.splice(idx + 1, 0, copyItem);
    onUpdateItems(updated);
    onSelectIndex(idx + 1);
  };

  const convertKeyingStyle = (targetStyle: 'bangla' | 'english') => {
    const banglaKeys = ['ক', 'খ', 'গ', 'ঘ'];
    const englishKeys = ['A', 'B', 'C', 'D'];

    const updated = items.map((item) => {
      const targetKeys = targetStyle === 'bangla' ? banglaKeys : englishKeys;
      const newOptions = item.options.map((opt, idx) => ({
        ...opt,
        key: targetKeys[idx] || opt.key,
      }));

      // Update answer
      let newAnswer = item.answer;
      const oldOptIndex = item.options.findIndex(
        (o) => o.key.toLowerCase() === item.answer.toLowerCase()
      );
      if (oldOptIndex !== -1 && targetKeys[oldOptIndex]) {
        newAnswer = targetKeys[oldOptIndex];
      }

      return {
        ...item,
        options: newOptions,
        answer: newAnswer,
      };
    });

    onUpdateItems(updated);
  };

  const filteredItems = items.filter(
    (item) =>
      item.stem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getSourceTags(item).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const dragEnabled = searchQuery.trim() === '';

  return (
    <div
      className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} border p-6 xl:p-8 flex flex-col gap-8 ${
        isAppLight
          ? 'border-slate-200'
          : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      {/* Header & Search */}
      <div className={`flex flex-wrap items-center justify-between gap-4 pb-5 border-b ${isAppLight ? 'border-slate-200' : 'border-slate-700/50'}`}>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Deck Questions {slides && slides.length > items.length ? `(${slides.length} Slides / ${items.length} Qs)` : `(${items.length})`}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {slides && slides.length > items.length
              ? 'Dedicated answer copy slides active — click any question or answer slide to view'
              : 'Reorder, edit stems, toggle answer keys, or transform keying style'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stems or sources..."
            className={`w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:border-amber-500 ${
              isAppLight
                ? 'bg-slate-50 border-slate-300 text-slate-900'
                : 'bg-slate-950 border-slate-800 text-white'
            }`}
          />
        </div>
      </div>

      {/* Deck Health Validation Inspector */}
      {items.length > 0 && <ValidationPanel items={items} onSelectItem={onSelectIndex} appTheme={appTheme} />}

      {/* ADD QUESTIONS — green banner right under Deck Health, opens the 3-source chooser modal */}
      {onAddQuestions && (
        <AddQuestionsBanner onClick={onAddQuestions} count={items.length} appTheme={appTheme} />
      )}

      {/* Bulk Transformation Bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border text-sm ${
          isAppLight
            ? 'bg-slate-50 border-slate-200 text-slate-700'
            : 'bg-slate-950 border-slate-800 text-slate-300'
        }`}
      >
        <span className="font-semibold">Bulk Tools:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => convertKeyingStyle('bangla')}
            className={`px-4 py-2 rounded-xl border transition-colors text-xs font-bold ${
              isAppLight
                ? 'bg-white border-slate-300 text-amber-700 hover:bg-slate-100'
                : 'bg-slate-900 border-slate-800 text-amber-300 hover:bg-slate-800'
            }`}
          >
            Keying → ক, খ, গ, ঘ
          </button>
          <button
            onClick={() => convertKeyingStyle('english')}
            className={`px-4 py-2 rounded-xl border transition-colors text-xs font-bold ${
              isAppLight
                ? 'bg-white border-slate-300 text-amber-700 hover:bg-slate-100'
                : 'bg-slate-900 border-slate-800 text-amber-300 hover:bg-slate-800'
            }`}
          >
            Keying → A, B, C, D
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {filteredItems.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            No questions found matching search.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredItems.map((item, idx) => {
                const questionSlideRef = slides?.find(s => s.questionIndex === idx && !s.isAnswerSlide);
                const answerSlideRef = slides?.find(s => s.questionIndex === idx && s.isAnswerSlide);

                const questionPhysicalIdx = questionSlideRef ? questionSlideRef.physicalIndex : idx;
                const isQuestionSelected = selectedIndex === questionPhysicalIdx;
                const isAnswerSelected = answerSlideRef ? selectedIndex === answerSlideRef.physicalIndex : false;

                return (
                  <div key={`${item.id}_${idx}`} className="space-y-2">
                    <SortableQuestionCard
                      item={item}
                      index={idx}
                      isSelected={isQuestionSelected}
                      isAppLight={isAppLight}
                      disabled={!dragEnabled}
                      onSelect={() => onSelectPhysicalSlide ? onSelectPhysicalSlide(questionPhysicalIdx) : onSelectIndex(idx)}
                      onEdit={onEditQuestion ? () => onEditQuestion(item) : undefined}
                      onDuplicate={() => duplicateItem(item, idx)}
                      onDelete={() => deleteItem(item.id)}
                    />
                    {answerSlideRef && (
                      <div
                        onClick={() => onSelectPhysicalSlide ? onSelectPhysicalSlide(answerSlideRef.physicalIndex) : null}
                        className={`ml-5 p-3 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                          isAnswerSelected
                            ? 'bg-purple-500/25 border-purple-400 ring-2 ring-purple-400/40 text-purple-100 shadow-lg'
                            : isAppLight
                            ? 'bg-purple-50/80 border-purple-200 hover:border-purple-300 text-purple-950'
                            : 'bg-purple-950/40 border-purple-900/60 hover:border-purple-700 text-purple-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 text-xs font-black min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate">Slide #{answerSlideRef.physicalIndex + 1}: Answer Copy Slide</span>
                          {item.answer && (
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                              [✓ {item.answer}]
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-500 text-slate-950 shrink-0">
                          ANSWER SLIDE
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};
