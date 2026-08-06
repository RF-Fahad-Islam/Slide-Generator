import React, { useState } from 'react';
import { MCQItem } from '../types';
import { MathText } from './MathText';
import { ValidationPanel } from './ValidationPanel';
import { Trash2, MoveUp, MoveDown, Search, Copy } from 'lucide-react';

interface DeckManagerProps {
  items: MCQItem[];
  onUpdateItems: (items: MCQItem[]) => void;
  onSelectIndex: (index: number) => void;
  selectedIndex: number;
  appTheme?: 'dark' | 'light';
}

export const DeckManager: React.FC<DeckManagerProps> = ({
  items,
  onUpdateItems,
  onSelectIndex,
  selectedIndex,
  appTheme = 'dark',
}) => {
  const isAppLight = appTheme === 'light';
  const [searchQuery, setSearchQuery] = useState('');

  // Move item up/down
  const moveItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    onUpdateItems(updated);
    onSelectIndex(toIdx);
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
      (item.source && item.source.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div
      className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} border p-8 flex flex-col gap-8 ${
        isAppLight
          ? 'border-slate-200'
          : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      {/* Header & Search */}
      <div className={`flex flex-wrap items-center justify-between gap-4 pb-5 border-b ${isAppLight ? 'border-slate-200' : 'border-slate-700/50'}`}>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Deck Questions ({items.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Reorder, edit stems, toggle answer keys, or transform keying style
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
          filteredItems.map((item, idx) => {
            const isSelected = selectedIndex === idx;

            return (
              <div
                key={`${item.id}_${idx}`}
                onClick={() => onSelectIndex(idx)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
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
                  <div className="flex items-start gap-4 flex-1">
                    <span className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="text-base font-bold leading-snug">
                        <MathText text={item.stem} />
                      </h4>

                      {/* Source & Type badge */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {item.source && (
                          <span className={`text-[11px] px-2.5 py-1 rounded-full border font-bold ${
                            isAppLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                          }`}>
                            {item.source}
                          </span>
                        )}
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${
                          isAppLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                        }`}>
                          Answer: {item.answer}
                        </span>
                        {item.questionType === 'roman_statements' && (
                          <span className={`text-[11px] px-2.5 py-1 rounded-full border font-bold ${
                            isAppLight ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                          }`}>
                            Bohupodi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions (Move, Duplicate, Delete) */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => moveItem(idx, idx - 1)}
                      disabled={idx === 0}
                      className={`p-2 rounded-xl disabled:opacity-30 transition-colors ${
                        isAppLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900' : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                      title="Move Up"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveItem(idx, idx + 1)}
                      disabled={idx === items.length - 1}
                      className={`p-2 rounded-xl disabled:opacity-30 transition-colors ${
                        isAppLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900' : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                      title="Move Down"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => duplicateItem(item, idx)}
                      className={`p-2 rounded-xl transition-colors ${
                        isAppLight ? 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700' : 'bg-slate-800 text-slate-300 hover:text-amber-400'
                      }`}
                      title="Duplicate Question"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className={`p-2 rounded-xl transition-colors ${
                        isAppLight ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                      }`}
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
