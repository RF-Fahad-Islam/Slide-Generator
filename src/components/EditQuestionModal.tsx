import React, { useState, useEffect } from 'react';
import { MCQItem, QuestionType } from '../types';
import { X, Save, Edit3, ArrowUpRight, Database } from 'lucide-react';

interface EditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MCQItem | null;
  onSave: (updated: MCQItem) => void;
  onOpenInDedicatedEditor: (item: MCQItem) => void;
  onSaveToQuestionBank?: (items: MCQItem[]) => Promise<boolean>;
  appTheme: 'dark' | 'light';
}

export const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
  onOpenInDedicatedEditor,
  onSaveToQuestionBank,
  appTheme,
}) => {
  const isAppLight = appTheme === 'light';

  const [questionType, setQuestionType] = useState<QuestionType>('standard');
  const [stem, setStem] = useState('');
  const [romanItems, setRomanItems] = useState<string[]>(['i. ', 'ii. ', 'iii. ']);
  const [prompt, setPrompt] = useState('নিচের কোনটি সঠিক?');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [answerKey, setAnswerKey] = useState('ক');
  const [sourceTag, setSourceTag] = useState('');
  const [explanation, setExplanation] = useState('');

  useEffect(() => {
    if (isOpen && item) {
      setQuestionType(item.questionType);
      setStem(item.stem);
      setRomanItems(item.romanItems && item.romanItems.length > 0 ? item.romanItems : ['i. ', 'ii. ', 'iii. ']);
      setPrompt(item.prompt || 'নিচের কোনটি সঠিক?');
      const optsText = item.options.map((o) => o.text);
      while (optsText.length < 4) optsText.push('');
      setOptions(optsText);
      setAnswerKey(item.answer || 'ক');
      setSourceTag(item.source || '');
      setExplanation(item.explanation || '');
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const buildUpdatedItem = (): MCQItem => {
    const keyLabels = ['ক', 'খ', 'গ', 'ঘ'];
    return {
      ...item,
      questionType,
      stem,
      romanItems:
        questionType === 'roman_statements'
          ? romanItems.filter((r) => r.trim().length > 2)
          : undefined,
      prompt: questionType === 'roman_statements' ? prompt : undefined,
      options: options.map((optText, idx) => ({
        key: keyLabels[idx] || `${idx + 1}`,
        text: optText || `Option ${idx + 1}`,
        isCorrect: (keyLabels[idx] || '').toLowerCase() === answerKey.toLowerCase(),
      })),
      answer: answerKey,
      source: sourceTag || undefined,
      explanation: explanation || undefined,
    };
  };

  const handleSave = () => {
    if (!stem.trim()) return;
    onSave(buildUpdatedItem());
    onClose();
  };

  const handleSaveToBank = async () => {
    if (!stem.trim() || !onSaveToQuestionBank) return;
    const saved = await onSaveToQuestionBank([buildUpdatedItem()]);
    if (saved) onClose();
  };

  const handleOpenInDedicated = () => {
    if (!stem.trim()) return;
    onOpenInDedicatedEditor(buildUpdatedItem());
  };

  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-amber-500 ${
    isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
  }`;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${
      isAppLight ? 'bg-black/40' : 'bg-black/80'
    }`}>
      <div className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} relative w-full max-w-2xl border p-6 lg:p-8 space-y-5 max-h-[92vh] overflow-y-auto ${
        isAppLight ? 'border-slate-200' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <button
          onClick={onClose}
          className={`absolute top-5 right-5 p-2.5 rounded-xl cursor-pointer transition-colors ${
            isAppLight ? 'bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className={`flex items-center gap-4 pb-4 border-b ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25">
            <Edit3 className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h3 className={`text-xl font-black ${isAppLight ? 'text-slate-900' : 'text-white'}`}>Edit Question</h3>
            <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Edit this question inline, or open it in the dedicated Question Editor.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Question type */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className={`text-xs font-bold uppercase tracking-wider ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Type:
            </label>
            <button
              type="button"
              onClick={() => setQuestionType('standard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                questionType === 'standard'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                  : isAppLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              Standard MCQ
            </button>
            <button
              type="button"
              onClick={() => setQuestionType('roman_statements')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                questionType === 'roman_statements'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                  : isAppLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              Bohupodi (i, ii, iii)
            </button>
          </div>

          {/* Stem */}
          <div>
            <label className={`block text-xs font-bold ${isAppLight ? 'text-slate-500' : 'text-slate-400'} mb-1.5 uppercase tracking-wider`}>
              Question Stem (supports $LaTeX$):
            </label>
            <input
              type="text"
              value={stem}
              onChange={(e) => setStem(e.target.value)}
              placeholder="e.g. মানবদেহের বৃক্কে নেফ্রনের প্রধান কাজ কোনটি?"
              className={inputCls}
            />
          </div>

          {/* Bohupodi roman items */}
          {questionType === 'roman_statements' && (
            <div className={`space-y-2 p-4 rounded-2xl border ${isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <label className={`block text-xs font-bold text-amber-500 uppercase tracking-wider`}>
                Roman Numeral Statements:
              </label>
              {romanItems.map((itemStr, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={itemStr}
                  onChange={(e) => {
                    const updated = [...romanItems];
                    updated[idx] = e.target.value;
                    setRomanItems(updated);
                  }}
                  className={inputCls}
                />
              ))}
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Prompt e.g. নিচের কোনটি সঠিক?"
                className={`${inputCls} ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}
              />
            </div>
          )}

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {['ক', 'খ', 'গ', 'ঘ'].map((keyLabel, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 p-2.5 rounded-2xl border ${
                  isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                  {keyLabel}
                </span>
                <input
                  type="text"
                  value={options[idx]}
                  onChange={(e) => {
                    const updated = [...options];
                    updated[idx] = e.target.value;
                    setOptions(updated);
                  }}
                  placeholder={`Option ${keyLabel}`}
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-amber-500 bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setAnswerKey(keyLabel)}
                  className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer shrink-0 ${
                    answerKey === keyLabel ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {answerKey === keyLabel ? '✓ Correct' : 'Answer'}
                </button>
              </div>
            ))}
          </div>

          {/* Source & explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-bold ${isAppLight ? 'text-slate-500' : 'text-slate-400'} mb-1`}>
                Board / Exam Source:
              </label>
              <input
                type="text"
                value={sourceTag}
                onChange={(e) => setSourceTag(e.target.value)}
                placeholder="e.g. ঢাকা বোর্ড ২০২৪"
                className={inputCls}
              />
            </div>
            <div>
              <label className={`block text-xs font-bold ${isAppLight ? 'text-slate-500' : 'text-slate-400'} mb-1`}>
                Explanation:
              </label>
              <input
                type="text"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Optional explanation"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className={`flex flex-wrap items-center gap-2 pt-4 border-t ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <button
            type="button"
            onClick={handleOpenInDedicated}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/20 hover:brightness-110"
            title="Open this question in the dedicated Question Editor (Bulk MCQ & Editor tab)"
          >
            <ArrowUpRight className="w-4 h-4" />
            Open in Question Editor
          </button>
          <div className="flex-1" />
          {onSaveToQuestionBank && (
            <button
              type="button"
              onClick={handleSaveToBank}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isAppLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
              }`}
              title="Save this question to the Question Bank (deck library) instead of the active deck"
            >
              <Database className="w-4 h-4" />
              Save to Question Bank
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isAppLight ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
