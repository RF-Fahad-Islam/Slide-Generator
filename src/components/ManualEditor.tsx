import React, { useState, useRef, useEffect } from 'react';
import { MCQItem, QuestionType } from '../types';
import { parseBulkTextToMCQs } from '../utils/bulkParser';
import { parseCSVToMCQs, generateSampleCSV } from '../utils/csvParser';
import { MathText } from './MathText';
import {
  Plus,
  Sparkles,
  FileText,
  CheckCircle2,
  HelpCircle,
  Trash2,
  FileSpreadsheet,
  Upload,
  Download,
  Edit2,
  Edit3,
  ArrowRight,
  Layers,
  Check,
  X,
  ListOrdered,
  Eye,
  ChevronLeft,
  ChevronRight,
  ListChecks
} from 'lucide-react';

interface ManualEditorProps {
  onAddMCQs: (items: MCQItem[]) => void;
  onClearAll: () => void;
  appTheme?: 'dark' | 'light';
  items?: MCQItem[]; // Active presentation deck
  onUpdateItems?: (items: MCQItem[]) => void;
  reviewItems?: MCQItem[]; // Incoming MCQs waiting for review
  onClearReviewItems?: () => void;
  prefillEditItem?: MCQItem | null; // Question to open in the form (from the deck-list edit modal)
  onPrefillConsumed?: () => void;
}

export const ManualEditor: React.FC<ManualEditorProps> = ({
  onAddMCQs,
  onClearAll,
  appTheme = 'dark',
  items = [],
  onUpdateItems,
  reviewItems = [],
  onClearReviewItems,
  prefillEditItem = null,
  onPrefillConsumed,
}) => {
  const isAppLight = appTheme === 'light';
  const [activeSubTab, setActiveSubTab] = useState<'review' | 'bulk' | 'single'>('bulk');

  // Internal Unapproved Review Queue
  const [unapprovedQueue, setUnapprovedQueue] = useState<MCQItem[]>(reviewItems);

  // Sync when reviewItems prop updates
  useEffect(() => {
    if (reviewItems && reviewItems.length > 0) {
      setUnapprovedQueue(reviewItems);
      setActiveSubTab('review');
    }
  }, [reviewItems]);

  // Bulk paste state
  const [bulkText, setBulkText] = useState<string>(`১. বৃক্কের কাজ কোনটি?
ক) রক্ত ছাঁকন *
খ) পিত্ত তৈরি
গ) শ্বেতকণিকা তৈরি
ঘ) পরিপাক
উত্তর: ক
[ঢাকা বোর্ড ২০২৪]

২. বৃক্কের পাথর অপসারণে আধুনিক পদ্ধতি—
i. ইউরেটেরোস্কোপিক
ii. আল্ট্রাসনিক লিথোট্রিপসি
iii. অস্ত্রোপচার
নিচের কোনটি সঠিক?
ক) i ও ii
খ) ii ও iii *
গ) i ও iii
ঘ) i, ii ও iii
[চট্টগ্রাম বোর্ড ২০১৭]`);

  // Live preview of whatever the parser would extract from the current bulk text
  const parsedPreview = parseBulkTextToMCQs(bulkText);

  // Single Question / Editor Form State
  const [editingItemTarget, setEditingItemTarget] = useState<'none' | 'queue' | 'deck'>('none');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [questionType, setQuestionType] = useState<QuestionType>('standard');
  const [stem, setStem] = useState('');
  const [romanItems, setRomanItems] = useState<string[]>(['i. ', 'ii. ', 'iii. ']);
  const [prompt, setPrompt] = useState('নিচের কোনটি সঠিক?');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [answerKey, setAnswerKey] = useState('ক');
  const [sourceTag, setSourceTag] = useState('');
  const [explanation, setExplanation] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Helper to load a given MCQ into the form for editing
  const loadItemIntoForm = (item: MCQItem, target: 'queue' | 'deck') => {
    setEditingItemTarget(target);
    setEditingId(item.id);
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
    setActiveSubTab('single');

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const resetForm = () => {
    setEditingItemTarget('none');
    setEditingId(null);
    setStem('');
    setOptions(['', '', '', '']);
    setExplanation('');
    setSourceTag('');
    setQuestionType('standard');
    setRomanItems(['i. ', 'ii. ', 'iii. ']);
    setPrompt('নিচের কোনটি সঠিক?');
  };

  // Batch-edit-all: walk through every question in the active deck inside the form.
  const [batchQueue, setBatchQueue] = useState<{ ids: string[]; index: number } | null>(null);

  // Open a question from the deck-list edit modal directly in this dedicated editor.
  useEffect(() => {
    if (prefillEditItem && onUpdateItems) {
      const target = items.find((q) => q.id === prefillEditItem.id) || prefillEditItem;
      loadItemIntoForm(target, 'deck');
      setBatchQueue(null);
      if (onPrefillConsumed) onPrefillConsumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillEditItem]);

  const startBatchEditAll = () => {
    if (items.length === 0) return;
    setBatchQueue({ ids: items.map((q) => q.id), index: 0 });
    loadItemIntoForm(items[0], 'deck');
    setActiveSubTab('single');
  };

  const batchNav = (dir: 'prev' | 'next') => {
    if (!batchQueue) return;
    let idx = dir === 'prev' ? batchQueue.index - 1 : batchQueue.index + 1;
    if (idx < 0) idx = batchQueue.ids.length - 1;
    if (idx >= batchQueue.ids.length) idx = 0;
    const targetItem = items.find((q) => q.id === batchQueue.ids[idx]);
    if (!targetItem) return;
    setBatchQueue({ ...batchQueue, index: idx });
    loadItemIntoForm(targetItem, 'deck');
  };

  const endBatchEdit = () => {
    setBatchQueue(null);
    resetForm();
  };

  // CSV Upload -> Passes through Question Reviewer first!
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const { items: parsedCsvItems, errors } = parseCSVToMCQs(content);
        if (parsedCsvItems.length > 0) {
          setUnapprovedQueue((prev) => [...prev, ...parsedCsvItems]);
          setActiveSubTab('review');
          alert(
            `Parsed ${parsedCsvItems.length} MCQs from CSV! Review and approve them in the Question Creator queue.`
          );
        } else {
          alert(`Could not parse MCQs from CSV. ${errors[0]?.message || 'Check column headers.'}`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadSampleCSV = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_mcq_format.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk parse text -> Passes through Question Reviewer!
  const handleParseBulk = () => {
    const parsed = parseBulkTextToMCQs(bulkText);
    if (parsed.length > 0) {
      setUnapprovedQueue((prev) => [...prev, ...parsed]);
      setBulkText('');
      setActiveSubTab('review');
    }
  };

  // Approve a single item from the review queue into active deck
  const approveQueueItem = (id: string) => {
    const itemToApprove = unapprovedQueue.find((q) => q.id === id);
    if (itemToApprove) {
      onAddMCQs([itemToApprove]);
      setUnapprovedQueue((prev) => prev.filter((q) => q.id !== id));
      if (editingId === id) resetForm();
    }
  };

  // Approve all items from the review queue into active deck
  const approveAllQueue = () => {
    if (unapprovedQueue.length === 0) return;
    onAddMCQs(unapprovedQueue);
    setUnapprovedQueue([]);
    if (onClearReviewItems) onClearReviewItems();
    resetForm();
  };

  const removeQueueItem = (id: string) => {
    setUnapprovedQueue((prev) => prev.filter((q) => q.id !== id));
    if (editingId === id) resetForm();
  };

  // Form submit: Adds a new MCQ OR updates existing item in Queue or Active Deck!
  const handleAddOrUpdateSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stem.trim()) return;

    const keyLabels = ['ক', 'খ', 'গ', 'ঘ'];
    const formattedOptions = options.map((optText, idx) => ({
      key: keyLabels[idx] || `${idx + 1}`,
      text: optText || `Option ${idx + 1}`,
      isCorrect: (keyLabels[idx] || '').toLowerCase() === answerKey.toLowerCase(),
    }));

    const updatedItem: MCQItem = {
      id: editingId || `mcq_manual_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      questionType,
      stem,
      romanItems:
        questionType === 'roman_statements'
          ? romanItems.filter((r) => r.trim().length > 2)
          : undefined,
      prompt: questionType === 'roman_statements' ? prompt : undefined,
      options: formattedOptions,
      answer: answerKey,
      source: sourceTag || undefined,
      explanation: explanation || undefined,
      confidence: 'high',
    };

    if (editingItemTarget === 'deck' && onUpdateItems) {
      // Update in active deck
      const updatedDeck = items.map((q) => (q.id === editingId ? updatedItem : q));
      onUpdateItems(updatedDeck);
    } else if (editingItemTarget === 'queue') {
      // Update in unapproved queue
      setUnapprovedQueue((prev) => prev.map((q) => (q.id === editingId ? updatedItem : q)));
    } else {
      // Direct approve & add to active deck
      onAddMCQs([updatedItem]);
    }

    resetForm();
  };

  const insertSnippet = (snippet: string) => {
    setBulkText((prev) => (prev ? `${prev}\n\n${snippet}` : snippet));
  };

  return (
    <div
      className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} border p-6 lg:p-8 space-y-8 ${
        isAppLight
          ? 'border-slate-200'
          : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      {/* Page Header Identity Bar */}
      <div className="flex items-center gap-4 pb-2">
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25 shrink-0">
          <Edit3 className="w-8 h-8 stroke-[2.5]" />
        </div>
        <div>
          <h2 className={`text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-3 ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
            Bulk MCQ Input & Editor
            <span className={`text-xs px-3 py-1 rounded-full font-mono font-black uppercase border ${
              isAppLight
                ? 'bg-amber-100 text-amber-700 border-amber-300'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              Bangla · LaTeX · CSV
            </span>
          </h2>
          <p className={`text-sm mt-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Paste raw exam text, import CSV spreadsheets, or craft single questions — every MCQ passes through the review queue before joining your deck.
          </p>
        </div>
      </div>

      {/* Header Bar & Tab Switcher */}
      <div className={`flex flex-wrap items-center justify-between gap-4 border-b pb-4 ${isAppLight ? 'border-slate-200' : 'border-slate-700/50'}`}>
        <div className={`flex flex-wrap items-center gap-2 p-1.5 rounded-2xl border ${
          isAppLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/20 border-slate-700/50'
        }`}>
          <button
            onClick={() => setActiveSubTab('bulk')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'bulk'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : isAppLight
                ? 'text-slate-700 hover:bg-slate-100'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Raw Text & CSV Parser</span>
          </button>

          <button
            onClick={() => setActiveSubTab('review')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
              activeSubTab === 'review'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : isAppLight
                ? 'text-slate-700 hover:bg-slate-100'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>2. Question Reviewer</span>
            {unapprovedQueue.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] font-black animate-pulse">
                {unapprovedQueue.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('single')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'single'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : isAppLight
                ? 'text-slate-700 hover:bg-slate-100'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>3. Form Question Creator</span>
            {editingId && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold">
                Editing
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-rose-500 hover:text-rose-400 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer font-bold"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Deck ({items.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: BULK PASTE & CSV IMPORT */}
      {activeSubTab === 'bulk' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Bulk Text Area */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Paste Raw MCQs Text Here
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Bengali, English, LaTeX math ($x^2$), & Bohupodi
              </span>
            </div>

            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Paste questions here... e.g. 1. Question stem? A) Opt 1 B) Opt 2 * C) Opt 3 D) Opt 4"
              className={`w-full h-80 font-['Hind_Siliguri',sans-serif] p-5 rounded-2xl border focus:outline-none focus:border-amber-500 text-base leading-relaxed resize-none shadow-inner ${
                isAppLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-slate-950 border-slate-800 text-slate-100'
              }`}
            />

            {/* Quick Snippet Insert Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Quick Snippets:</span>
              <button
                type="button"
                onClick={() =>
                  insertSnippet(
                    `১. সালোকসংশ্লেষণ প্রক্রিয়ার প্রধান রঞ্জক কোনটি?\nক) ক্লোরোফিল-এ *\nখ) ক্যারোটিন\nগ) জ্যান্থোফিল\nঘ) ফাইকোসায়ানিন`
                  )
                }
                className={`text-xs px-3 py-1.5 rounded-xl border font-semibold ${
                  isAppLight
                    ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                + Standard MCQ
              </button>
              <button
                type="button"
                onClick={() =>
                  insertSnippet(
                    `২. বৃত্তের সমীকরণ $x^2 + y^2 = 25$ হলে এর ব্যাসার্ধ কত?\nক) 5 *\nখ) 25\nগ) 10\nঘ) 50`
                  )
                }
                className={`text-xs px-3 py-1.5 rounded-xl border font-semibold ${
                  isAppLight
                    ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                + Math Formula MCQ
              </button>
              <button
                type="button"
                onClick={() =>
                  insertSnippet(
                    `৩. রক্তে প্লাজমার প্রধান কাজ—\ni. খাদ্য উপাদান পরিবহন\nii. বর্জ্য নিষ্কাশন\niii. অক্সিজেন পরিবহন\nনিচের কোনটি সঠিক?\nক) i ও ii *\nখ) ii ও iii\nগ) i ও iii\nঘ) i, ii ও iii`
                  )
                }
                className={`text-xs px-3 py-1.5 rounded-xl border font-semibold ${
                  isAppLight
                    ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                + Bohupodi MCQ
              </button>
            </div>

            {/* Action Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleParseBulk}
                disabled={!bulkText.trim()}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 hover:brightness-110 transition-all cursor-pointer"
              >
                <Sparkles className="w-5 h-5 fill-slate-950" />
                <span>
                  Parse Questions into Review Creator ({parsedPreview.length}{' '}
                  MCQs) →
                </span>
              </button>
            </div>

            {/* Live Parse Preview — mock slide of the first parsed question */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Live Parse Preview
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {parsedPreview.length > 0
                    ? `${parsedPreview.length} MCQ${parsedPreview.length > 1 ? 's' : ''} ready for review`
                    : 'Waiting for a valid format…'}
                </span>
              </div>

              {parsedPreview.length > 0 ? (
                <div className={`max-h-96 overflow-y-auto rounded-xl border space-y-3 p-3 ${
                  isAppLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950'
                }`}>
                  {parsedPreview.map((mcq, idx) => (
                    <div
                      key={mcq.id}
                      className={`relative rounded-xl border p-3.5 ${
                        isAppLight
                          ? 'border-slate-200 bg-white'
                          : 'border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/40'
                      }`}
                    >
                      {/* Question number badge */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className={`text-sm font-bold leading-snug ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                            <MathText text={mcq.stem} />
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg shrink-0 ${
                          mcq.questionType === 'roman_statements'
                            ? 'bg-violet-500/20 text-violet-400 border border-violet-500/40'
                            : mcq.questionType === 'passage'
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {mcq.questionType === 'roman_statements'
                            ? 'বহুপদী'
                            : mcq.questionType === 'passage'
                              ? 'Passage'
                              : 'Standard'}
                        </span>
                      </div>

                      {/* Roman statements (i, ii, iii) */}
                      {mcq.romanItems && mcq.romanItems.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {mcq.romanItems.map((ri, riIdx) => (
                            <span
                              key={riIdx}
                              className={`text-[11px] px-2 py-0.5 rounded-lg border ${
                                isAppLight
                                  ? 'bg-slate-100 border-slate-200 text-slate-700'
                                  : 'bg-white/5 border-white/10 text-slate-300'
                              }`}
                            >
                              <MathText text={ri} />
                            </span>
                          ))}
                          {mcq.prompt && (
                            <span className={`text-[11px] px-2 py-0.5 rounded-lg border font-semibold ${
                              isAppLight
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            }`}>
                              <MathText text={mcq.prompt} />
                            </span>
                          )}
                        </div>
                      )}

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {mcq.options.map((opt) => {
                          const isCorrect = opt.isCorrect || opt.key.toLowerCase() === mcq.answer?.toLowerCase();
                          return (
                            <div
                              key={opt.key}
                              className={`px-2 py-1 rounded-lg border text-[11px] font-semibold ${
                                isCorrect
                                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                  : isAppLight
                                    ? 'bg-slate-100 border-slate-200 text-slate-700'
                                    : 'bg-white/5 border-white/10 text-slate-300'
                              }`}
                            >
                              <span className="font-mono font-bold mr-1">{opt.key}.</span>
                              <MathText text={opt.text} />
                              {isCorrect && <CheckCircle2 className="inline w-3 h-3 text-amber-400 ml-1 -mt-0.5" />}
                            </div>
                          );
                        })}
                      </div>

                      {/* Answer key + source footer */}
                      <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-dashed ${
                        isAppLight ? 'border-slate-200' : 'border-slate-800'
                      }">
                        <span className={`text-[10px] font-mono font-bold ${isAppLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                          ✓ উত্তর: {mcq.answer}
                        </span>
                        {mcq.source && (
                          <span className={`text-[10px] font-semibold truncate ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
                            <MathText text={`[${mcq.source}]`} />
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`rounded-xl border border-dashed p-4 text-center text-xs ${
                  isAppLight ? 'border-slate-300 text-slate-400' : 'border-slate-800 text-slate-500'
                }`}>
                  All parsed MCQs appear here as a scrollable list while you type a valid format.
                </div>
              )}
            </div>
          </div>

          {/* Format Helper Sidebar & CSV Import */}
          <div
            className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 border text-xs flex flex-col gap-4 ${
              isAppLight
                ? 'border-slate-200'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            {/* CSV Import Box */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-900/10 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <h4 className={`font-extrabold text-xs uppercase tracking-wider ${isAppLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  CSV File Import
                </h4>
              </div>
              <p className={`text-[11px] leading-snug ${isAppLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Upload a structured <code className="font-mono font-bold">.csv</code> spreadsheet
                with columns: <code className="font-mono font-bold">stem, A, B, C, D, correct</code>
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload CSV Spreadsheet</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSampleCSV}
                  className={`w-full py-1.5 px-3 rounded-xl font-semibold text-[11px] border flex items-center justify-center gap-1.5 cursor-pointer ${
                    isAppLight
                      ? 'bg-white border-slate-300 text-emerald-700 hover:bg-slate-100'
                      : 'bg-slate-900 border-slate-800 text-emerald-300 hover:bg-slate-800'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV Template</span>
                </button>
              </div>
            </div>

            <h3 className="text-xs font-extrabold text-amber-500 flex items-center gap-2 uppercase tracking-wider pt-2 border-t border-slate-700/50">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              Bulk Paste Format Guide
            </h3>

            <div className="space-y-3">
              <div
                className={`p-3 rounded-xl border ${
                  isAppLight
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <p className="font-bold mb-1">1. Option Format</p>
                <p className="text-slate-400">
                  Matches <code className="text-amber-500 font-mono">A) B) C) D)</code> or{' '}
                  <code className="text-amber-500 font-mono">ক) খ) গ) ঘ)</code>
                </p>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isAppLight
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <p className="font-bold mb-1">2. Marking Correct Answer</p>
                <p className="text-slate-400">
                  Add an asterisk <code className="text-amber-500 font-mono">*</code> at option
                  end, or add <code className="text-amber-500 font-mono">উত্তর: খ</code>
                </p>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isAppLight
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <p className="font-bold mb-1">3. Bohupodi (Multi-Statement)</p>
                <p className="text-slate-400">
                  Statements starting with <code className="text-amber-500 font-mono">i. ii. iii.</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: QUESTION REVIEWER QUEUE (Review, Edit & Approve Gatekeeper) */}
      {activeSubTab === 'review' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30">
            <div>
              <h3 className="text-base font-black text-amber-500 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Questions Creator Review Queue ({unapprovedQueue.length} Pending Approval)
              </h3>
              <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                All parsed questions from AI, bulk text, or CSV pass through here for your inspection & editing before joining your active slide deck.
              </p>
            </div>

            {unapprovedQueue.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setUnapprovedQueue([])}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 border border-slate-700 cursor-pointer"
                >
                  Discard All Queue
                </button>
                <button
                  type="button"
                  onClick={approveAllQueue}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve All ({unapprovedQueue.length}) → Active Deck</span>
                </button>
              </div>
            )}
          </div>

          {unapprovedQueue.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 stroke-[1.5]" />
              <h4 className="text-base font-bold text-slate-200">No Pending Questions in Queue</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Paste raw text into the "Parser" tab or run the AI PDF Parser to send MCQs into this review queue.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {unapprovedQueue.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-5 rounded-3xl border transition-all space-y-3 ${
                    isAppLight
                      ? 'glass-card-fatty-light border-slate-200 text-slate-900'
                      : 'glass-card-fatty bg-slate-950 border-slate-800 text-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold leading-snug">
                          <MathText text={item.stem} />
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold font-mono">
                            Answer: {item.answer}
                          </span>
                          {item.source && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {item.source}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Edit in Creator, Approve, Remove */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => loadItemIntoForm(item, 'queue')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 cursor-pointer transition-colors ${
                          isAppLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-amber-700 border-slate-300'
                            : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                        }`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit in Form</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => approveQueueItem(item.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeQueueItem(item.id)}
                        className={`p-1.5 rounded-xl border cursor-pointer transition-colors ${
                          isAppLight ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                        }`}
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Options List Preview */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                    {item.options.map((opt) => {
                      const isCorrect =
                        opt.isCorrect || opt.key.toLowerCase() === item.answer?.toLowerCase();
                      return (
                        <div
                          key={opt.key}
                          className={`p-2 rounded-xl border flex items-center gap-2 font-medium truncate ${
                            isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 font-bold'
                              : isAppLight
                              ? 'bg-white border-slate-200 text-slate-700'
                              : 'bg-slate-900 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="font-bold text-amber-500 font-mono text-[10px]">
                            {opt.key}.
                          </span>
                          <span className="truncate">
                            <MathText text={opt.text} />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: FORM QUESTION CREATOR & EDITOR */}
      {activeSubTab === 'single' && (
        <form ref={formRef} onSubmit={handleAddOrUpdateSingle} className="space-y-6 max-w-4xl">
          {/* Batch edit-all toolbar */}
          {batchQueue && (
            <div className={`p-4 rounded-2xl border flex flex-wrap items-center gap-3 text-xs ${
              isAppLight ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-950 border-indigo-500/40'
            }`}>
              <span className={`font-black flex items-center gap-2 ${isAppLight ? 'text-indigo-700' : 'text-indigo-300'}`}>
                <ListChecks className="w-4 h-4" />
                Batch Editing All Deck Questions
              </span>
              <span className={`px-2.5 py-1 rounded-lg font-mono font-black ${isAppLight ? 'bg-white text-indigo-700 border border-indigo-200' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'}`}>
                {batchQueue.index + 1} / {batchQueue.ids.length}
              </span>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => batchNav('prev')}
                className={`px-3 py-1.5 rounded-xl font-bold border flex items-center gap-1 cursor-pointer ${
                  isAppLight ? 'bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-100' : 'bg-slate-900 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              <button
                type="button"
                onClick={() => batchNav('next')}
                className={`px-3 py-1.5 rounded-xl font-bold border flex items-center gap-1 cursor-pointer ${
                  isAppLight ? 'bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-100' : 'bg-slate-900 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20'
                }`}
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={endBatchEdit}
                className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer ${
                  isAppLight ? 'bg-slate-800 text-white' : 'bg-slate-800 text-white'
                }`}
              >
                Done
              </button>
            </div>
          )}

          {/* Banner showing if we are editing an existing question */}
          {editingId ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-bold text-emerald-400">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                <span>
                  Editing Question (Source: {editingItemTarget === 'deck' ? 'Active Slide Deck' : 'Review Queue'})
                </span>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1 rounded-xl bg-slate-800 text-slate-200 hover:text-white text-[11px]"
              >
                Cancel & Create New
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create New Single MCQ
              </h3>
            </div>
          )}

          {/* Question Type Selection */}
          <div className="flex items-center gap-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Question Type:
            </label>
            <div className="flex items-center gap-3">
              <label
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border transition-all ${
                  questionType === 'standard'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                    : isAppLight
                    ? 'bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="qType"
                  checked={questionType === 'standard'}
                  onChange={() => setQuestionType('standard')}
                  className="hidden"
                />
                Standard MCQ
              </label>

              <label
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border transition-all ${
                  questionType === 'roman_statements'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                    : isAppLight
                    ? 'bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="qType"
                  checked={questionType === 'roman_statements'}
                  onChange={() => setQuestionType('roman_statements')}
                  className="hidden"
                />
                Bohupodi (i, ii, iii Statements)
              </label>
            </div>
          </div>

          {/* Stem Input */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Question Stem (Supports $LaTeX$ math e.g. $x^2 + y^2 = 25$):
            </label>
            <input
              type="text"
              value={stem}
              onChange={(e) => setStem(e.target.value)}
              placeholder="e.g. মানবদেহের বৃক্কে নেফ্রনের প্রধান কাজ কোনটি?"
              className={`w-full px-4 py-3 rounded-2xl border text-base focus:outline-none focus:border-amber-500 ${
                isAppLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-slate-950 border-slate-800 text-white'
              }`}
              required
            />
            {stem.includes('$') && (
              <div
                className={`mt-2 p-3 rounded-xl border text-sm ${
                  isAppLight
                    ? 'bg-slate-100 border-slate-200 text-amber-700'
                    : 'bg-slate-950 border-slate-800 text-amber-300'
                }`}
              >
                <span className="text-xs text-slate-400 block mb-1">Math Formula Live Preview:</span>
                <MathText text={stem} />
              </div>
            )}
          </div>

          {/* Bohupodi Roman Items */}
          {questionType === 'roman_statements' && (
            <div
              className={`space-y-3 p-4 rounded-2xl border ${
                isAppLight
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <label className="block text-xs font-bold text-amber-500 uppercase tracking-wider">
                Roman Numeral Statements:
              </label>
              {romanItems.map((itemStr, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={itemStr}
                    onChange={(e) => {
                      const updated = [...romanItems];
                      updated[idx] = e.target.value;
                      setRomanItems(updated);
                    }}
                    className={`flex-1 px-3 py-2 rounded-xl border text-sm ${
                      isAppLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  />
                </div>
              ))}
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Prompt e.g. নিচের কোনটি সঠিক?"
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  isAppLight
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-900 border-slate-800 text-amber-300'
                }`}
              />
            </div>
          )}

          {/* 4 Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['ক', 'খ', 'গ', 'ঘ'].map((keyLabel, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-2xl border ${
                  isAppLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-950 border-slate-800'
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
                  className={`flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-amber-500 ${
                    isAppLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-900 border-slate-800 text-white'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setAnswerKey(keyLabel)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    answerKey === keyLabel
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {answerKey === keyLabel ? '✓ Correct' : 'Set Answer'}
                </button>
              </div>
            ))}
          </div>

          {/* Board Source & Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Board / Exam Source Tag (Optional):
              </label>
              <input
                type="text"
                value={sourceTag}
                onChange={(e) => setSourceTag(e.target.value)}
                placeholder="e.g. ঢাকা বোর্ড ২০২৪ / DU Admission 2023"
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  isAppLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Explanation (Optional):
              </label>
              <input
                type="text"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="e.g. নেফ্রন হলো বৃক্কের গঠনগত ও কার্যগত একক..."
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  isAppLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-8 py-3.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg hover:brightness-110 cursor-pointer"
            >
              {editingId ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              <span>{editingId ? 'Save & Update Question' : 'Add Question to Active Deck'}</span>
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-3.5 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* ACTIVE PRESENTATION DECK RE-EDITOR INSPECTOR */}
      {items.length > 0 && (
        <div className={`pt-8 border-t space-y-4 ${isAppLight ? 'border-slate-200' : 'border-slate-700/50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 ${isAppLight ? 'text-amber-700' : 'text-amber-500'}`}>
                <ListOrdered className="w-4 h-4" /> Active Presentation Deck Questions ({items.length})
              </h3>
              <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Click "Edit in Creator" on any existing MCQ to update its stem, options, or answer key.
              </p>
            </div>
            <button
              type="button"
              onClick={startBatchEditAll}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all shrink-0 ${
                isAppLight
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100'
                  : 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20'
              }`}
              title="Open every deck question in the editor view to batch edit them one by one"
            >
              <ListChecks className="w-4 h-4" />
              Batch Edit All in Editor
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={`${item.id}_${idx}`}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  isAppLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-slate-950 border-slate-800 text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold truncate max-w-[300px] sm:max-w-[500px]">
                      <MathText text={item.stem} />
                    </h4>
                    <span className={`text-[10px] font-mono font-semibold ${isAppLight ? 'text-amber-700' : 'text-amber-500'}`}>
                      Ans: {item.answer} {item.source ? `• ${item.source}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => loadItemIntoForm(item, 'deck')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 cursor-pointer transition-colors ${
                      isAppLight
                        ? 'bg-slate-100 hover:bg-amber-100 text-amber-700 border-slate-300 hover:border-amber-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                    }`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit in Creator</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
