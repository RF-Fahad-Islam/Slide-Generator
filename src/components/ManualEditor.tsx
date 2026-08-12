import React, { useState, useRef, useEffect } from 'react';
import { MCQItem, MCQTags, QuestionType, getSourceTags } from '../types';
import { parseBulkTextToMCQs, parseBulkTextToBlocks, serializeMCQToBlockText } from '../utils/bulkParser';
import { parseCSVToMCQs, generateSampleCSV } from '../utils/csvParser';
import { MathText } from './MathText';
import { SourceTagsInput } from './SourceTagsInput';
import { TagChipSelect } from './TagChipSelect';
import { useTagMemory } from '../hooks/useTagMemory';
import { applyBatchTags } from '../utils/tagMemory';
import { EditableMCQCard } from './workspaces/EditableMCQCard';
import { MathHelperButton } from './math/MathHelperButton';
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
  ListChecks,
  Database,
  Bot,
  ClipboardCopy,
  Tags,
  History
} from 'lucide-react';

interface ManualEditorProps {
  appTheme?: 'dark' | 'light';
  // Workspace-scoped review queue — this workspace's own paste/review state,
  // not a global "Active Deck". Persisted by the caller (WorkspaceEditor) into
  // the workspace's Dexie row.
  reviewQueue: MCQItem[];
  onReviewQueueChange: (next: MCQItem[]) => void;
  onApproveSelected: (items: MCQItem[]) => Promise<void>;
  defaultTags?: MCQTags;
  applyWorkspaceDefaultTags: boolean;
  onToggleApplyWorkspaceDefaultTags: () => void;
  prefillEditItem?: MCQItem | null; // Question to open in the form (from the deck-list edit modal)
  onPrefillConsumed?: () => void;
}

// Copy-ready prompt for any external AI (ChatGPT / Gemini / Claude etc.). The user
// uploads a question-paper image/PDF to that AI and pastes this prompt so the AI
// returns the EXACT raw-text format the bulk parser understands.
const AI_TRANSCRIBE_PROMPT = `You are a question-paper transcription assistant.

Look at the image/PDF I am giving you and transcribe every multiple-choice question into EXACTLY the raw text format below. Output ONLY the raw text, no commentary.

Rules:
1. One question per block, separated by a blank line.
2. Start each question with its number, e.g. "১." or "1.".
3. Write the question stem as plain text.
4. Write each option on its own line using Bangla keys "ক)" "খ)" "গ)" "ঘ)" (or A) B) C) D) if the paper uses English). Do NOT number the options.
5. Mark the correct option with an asterisk "*" right after that option's text.
6. If the paper is a "বহুপদী" (i/ii/iii statements) question, write the statements as "i." "ii." "iii." lines, then a prompt line like "নিচের কোনটি সঠিক?", then the options.
7. If a question has an explanation, add a line starting with "ব্যাখ্যা:" followed by the explanation text.
8. If a question shows a source (e.g. a board name / year like "ঢাকা বোর্ড ২০২৪"), put it on its own line inside square brackets like "[ঢাকা বোর্ড ২০২৪]".
9. Optional category fields — add these lines ONLY when you can infer them confidently from the paper (headings, footers, board seals, subject name on the cover). If you are not sure, omit them:
   subject: <subject name, e.g. Biology / জীববিজ্ঞান>
   class: <class level, e.g. SSC / HSC / Class 9>
   paper: <paper number, e.g. 1st Paper / 2nd Paper>
10. Keep LaTeX math ($...$) exactly as written. Keep Bangla text exact.

Example output:
১. মানবদেহের বৃক্কে নেফ্রনের প্রধান কাজ কোনটি?
ক) রক্ত ছাঁকন *
খ) পিত্ত তৈরি
গ) শ্বেতকণিকা তৈরি
ঘ) পরিপাক
ব্যাখ্যা: নেফ্রন হলো বৃক্কের গঠনগত ও কার্যগত একক।
[ঢাকা বোর্ড ২০২৪]
subject: জীববিজ্ঞান
class: SSC
paper: 1st Paper

২. বৃক্কের পাথর অপসারণে আধুনিক পদ্ধতি—
i. ইউরেটেরোস্কোপিক
ii. আল্ট্রাসনিক লিথোট্রিপসি
iii. অস্ত্রোপচার
নিচের কোনটি সঠিক?
ক) i ও ii
খ) ii ও iii *
গ) i ও iii
ঘ) i, ii ও iii
[চট্টগ্রাম বোর্ড ২০১৭]`;

const DEFAULT_BULK_TEXT = `১. বৃক্কের কাজ কোনটি?
ক) রক্ত ছাঁকন *
খ) পিত্ত তৈরি
গ) শ্বেতকণিকা তৈরি
ঘ) পরিপাক
উত্তর: ক
[ঢাকা বোর্ড ২০২৪]
subject: জীববিজ্ঞান
class: SSC
paper: 1st Paper

২. বৃক্কের পাথর অপসারণে আধুনিক পদ্ধতি—
i. ইউরেটেরোস্কোপিক
ii. আল্ট্রাসনিক লিথোট্রিপসি
iii. অস্ত্রোপচার
নিচের কোনটি সঠিক?
ক) i ও ii
খ) ii ও iii *
গ) i ও iii
ঘ) i, ii ও iii
[চট্টগ্রাম বোর্ড ২০১৭]`;

// Auto-saved draft of everything the user has pasted/parsed/reviewed but not
// yet committed to the deck or bank. ManualEditor is only mounted while its
// tab is active (`{activeTab === 'manual' && <ManualEditor />}` in App.tsx),
// so any tab switch unmounts it and would otherwise wipe unsaved review-queue
// cards and pasted text with no warning. Persisting to localStorage on every
// change and rehydrating on mount closes that hole.
const DRAFT_STORAGE_KEY = 'mcqgen.manualEditor.draft';

interface ManualEditorDraft {
  bulkText: string;
  bulkViewMode: 'raw' | 'cards';
  batchSourceTags: string[];
  batchSubject: string;
  batchClass: string;
  batchPaper: string;
  stagedItems: MCQItem[];
}

function loadDraft(): Partial<ManualEditorDraft> {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDraft(draft: ManualEditorDraft): void {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // localStorage unavailable (private mode / quota) — draft just won't survive a remount
  }
}

export const ManualEditor: React.FC<ManualEditorProps> = ({
  appTheme = 'dark',
  reviewQueue,
  onReviewQueueChange,
  onApproveSelected,
  defaultTags,
  applyWorkspaceDefaultTags,
  onToggleApplyWorkspaceDefaultTags,
  prefillEditItem = null,
  onPrefillConsumed,
}) => {
  const isAppLight = appTheme === 'light';
  const [activeSubTab, setActiveSubTab] = useState<'review' | 'bulk' | 'single'>('bulk');

  // Read the auto-saved draft exactly once per mount — every field below falls
  // back to it before its own hardcoded default, so a tab switch (which
  // unmounts this component) never silently drops in-progress work. The
  // review queue itself is NOT part of this draft anymore — it's owned by the
  // workspace (Dexie), passed in via the reviewQueue prop.
  const [draft] = useState<Partial<ManualEditorDraft>>(() => loadDraft());

  // Shared input style for the in-place review-queue editor
  const queueInputCls = `w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-amber-500 ${
    isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
  }`;

  // Internal Unapproved Review Queue — seeded once from the workspace's own
  // persisted queue; every change is written straight back via onReviewQueueChange
  // so it survives a workspace switch (this component remounts per workspace).
  const [unapprovedQueue, setUnapprovedQueue] = useState<MCQItem[]>(reviewQueue);

  useEffect(() => {
    onReviewQueueChange(unapprovedQueue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unapprovedQueue]);

  // Click-to-select cards for bulk approve (replaces the old per-card Approve button).
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelectedIds(new Set(unapprovedQueue.map((q) => q.id)));
  const deselectAll = () => setSelectedIds(new Set());

  // Brief inline confirmation shown after approving (we stay put instead of
  // navigating away, so this closes the feedback loop).
  const [queueToast, setQueueToast] = useState<string | null>(null);

  // Batch tags applied to EVERY MCQ parsed from the bulk paste text.
  const [batchSourceTags, setBatchSourceTags] = useState<string[]>(draft.batchSourceTags || []);
  const [batchSubject, setBatchSubject] = useState(draft.batchSubject || '');
  const [batchClass, setBatchClass] = useState(draft.batchClass || '');
  const [batchPaper, setBatchPaper] = useState(draft.batchPaper || '');

  // Bulk paste state
  const [bulkText, setBulkText] = useState<string>(draft.bulkText ?? DEFAULT_BULK_TEXT);

  // Paste-area view toggle: 'raw' = plain textarea, 'cards' = live editable MCQ cards.
  const [bulkViewMode, setBulkViewMode] = useState<'raw' | 'cards'>(draft.bulkViewMode || 'raw');
  const justPastedBulkRef = useRef(false);
  const bulkTextRef = useRef<HTMLTextAreaElement>(null);

  // Auto-switch to Cards right after a paste that parsed into at least one MCQ.
  useEffect(() => {
    if (!justPastedBulkRef.current) return;
    justPastedBulkRef.current = false;
    if (parseBulkTextToBlocks(bulkText).length > 0) {
      setBulkViewMode('cards');
    }
  }, [bulkText]);

  // --- Cards-mode editing: bulkText stays the single source of truth. Each edit
  // re-serializes just the touched block and splices it back in, so Raw Text
  // always reflects the latest card edits and vice versa.
  const patchBlockItem = (index: number, patch: Partial<MCQItem>) => {
    const pairs = parseBulkTextToBlocks(bulkText);
    if (!pairs[index]) return;
    const updatedItem = { ...pairs[index].item, ...patch };
    const blocks = pairs.map((p, i) => (i === index ? serializeMCQToBlockText(updatedItem) : p.blockText));
    setBulkText(blocks.join('\n\n'));
  };

  const patchBlockOption = (index: number, key: string, text: string) => {
    const item = parseBulkTextToBlocks(bulkText)[index]?.item;
    if (!item) return;
    patchBlockItem(index, { options: item.options.map((o) => (o.key === key ? { ...o, text } : o)) });
  };

  const setBlockAnswer = (index: number, key: string) => {
    const item = parseBulkTextToBlocks(bulkText)[index]?.item;
    if (!item) return;
    patchBlockItem(index, {
      answer: key,
      options: item.options.map((o) => ({ ...o, isCorrect: o.key === key })),
    });
  };

  const removeBlock = (index: number) => {
    const blocks = parseBulkTextToBlocks(bulkText)
      .map((p) => p.blockText)
      .filter((_, i) => i !== index);
    setBulkText(blocks.join('\n\n'));
  };

  const addBlankCard = () => {
    const scaffold = `নতুন প্রশ্ন লিখুন?\nক) অপশন ১ *\nখ) অপশন ২\nগ) অপশন ৩\nঘ) অপশন ৪`;
    setBulkText((prev) => (prev.trim() ? `${prev}\n\n${scaffold}` : scaffold));
    setBulkViewMode('cards');
  };

// Applies the manual per-batch tag chips, then — only when the user has opted in —
  // the workspace's default tags. Both passes only fill blank fields (applyBatchTags
  // never overwrites), so precedence is: question's own tags > batch chips > workspace defaults.
  const applyAllBatchTags = (q: MCQItem): MCQItem => {
    let next = applyBatchTags(q, {
      sources: batchSourceTags,
      subject: batchSubject,
      className: batchClass,
      paper: batchPaper,
    });
    if (applyWorkspaceDefaultTags && defaultTags) {
      next = applyBatchTags(next, {
        subject: defaultTags.subject,
        className: defaultTags.className,
        paper: defaultTags.paper,
      });
    }
    return next;
  };

  // Live preview of whatever the parser would extract from the current bulk text,
  // with the interactive batch tags applied (so the preview is a true WYSIWYG of
  // what the parse button will push into the review queue).
  const parsedPreview = parseBulkTextToMCQs(bulkText).map(applyAllBatchTags);

  // Single Question / Editor Form State
  const [editingItemTarget, setEditingItemTarget] = useState<'none' | 'queue'>('none');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [questionType, setQuestionType] = useState<QuestionType>('standard');
  const [stem, setStem] = useState('');
  const [romanItems, setRomanItems] = useState<string[]>(['i. ', 'ii. ', 'iii. ']);
  const [prompt, setPrompt] = useState('নিচের কোনটি সঠিক?');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [answerKey, setAnswerKey] = useState('ক');
  const [sourceTags, setSourceTags] = useState<string[]>([]);
  const [explanation, setExplanation] = useState('');
  const [tagSubject, setTagSubject] = useState('');
  const [tagClass, setTagClass] = useState('');
  const [tagPaper, setTagPaper] = useState('');

  // Staged questions created in the Form Question Creator. "Save" appends here
  // instead of committing straight to the deck; a batch action pushes them all
  // to the Active Deck or the Question Bank, then clears with a success message.
  const [stagedItems, setStagedItems] = useState<MCQItem[]>(draft.stagedItems || []);
  const [formNotice, setFormNotice] = useState<string | null>(null);

  // Instant auto-save: any change to pasted text or staged questions is written
  // straight to localStorage, so switching away or an accidental reload never
  // loses it (the review queue itself persists separately via onReviewQueueChange).
  useEffect(() => {
    saveDraft({
      bulkText,
      bulkViewMode,
      batchSourceTags,
      batchSubject,
      batchClass,
      batchPaper,
      stagedItems,
    });
  }, [bulkText, bulkViewMode, batchSourceTags, batchSubject, batchClass, batchPaper, stagedItems]);

  // Tag memory — remembers every used source tag / subject / class / paper so the
  // next session can suggest them in the chip pickers below.
  const { memory, remember, rememberItems } = useTagMemory();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Helper to load a given MCQ into the form for editing
  const loadItemIntoForm = (item: MCQItem, target: 'queue') => {
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
    setSourceTags(getSourceTags(item));
    setExplanation(item.explanation || '');
    setTagSubject(item.tags?.subject || '');
    setTagClass(item.tags?.className || '');
    setTagPaper(item.tags?.paper || '');
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
    setSourceTags([]);
    setTagSubject('');
    setTagClass('');
    setTagPaper('');
    setQuestionType('standard');
    setRomanItems(['i. ', 'ii. ', 'iii. ']);
    setPrompt('নিচের কোনটি সঠিক?');
  };

  // "Add more" accelerator: pull the most recently queued question's tags into
  // the form so the next question starts tagged the same way.
  const lastItemTags = unapprovedQueue.length > 0 ? unapprovedQueue[unapprovedQueue.length - 1] : null;

  const useLastItemTags = () => {
    if (!lastItemTags) return;
    setSourceTags(getSourceTags(lastItemTags));
    setTagSubject(lastItemTags.tags?.subject || '');
    setTagClass(lastItemTags.tags?.className || '');
    setTagPaper(lastItemTags.tags?.paper || '');
  };

  const clearBatchTags = () => {
    setBatchSourceTags([]);
    setBatchSubject('');
    setBatchClass('');
    setBatchPaper('');
  };

  // Open a question directly in this editor (e.g. a future deep-link) — always
  // targets the review queue, since there's no separate "Active Deck" in a
  // workspace-scoped editor.
  useEffect(() => {
    if (prefillEditItem) {
      const target = unapprovedQueue.find((q) => q.id === prefillEditItem.id) || prefillEditItem;
      loadItemIntoForm(target, 'queue');
      if (onPrefillConsumed) onPrefillConsumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillEditItem]);

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
    const parsed = parseBulkTextToMCQs(bulkText).map(applyAllBatchTags);
    if (parsed.length > 0) {
      setUnapprovedQueue((prev) => [...prev, ...parsed]);
      rememberItems(parsed);
      setBulkText('');
      setActiveSubTab('review');
    }
  };

  // Bulk approve — the selected cards move out of the queue and into the
  // workspace's permanent Approved history (+ its linked deck), via
  // onApproveSelected. We stay on the review page; the toast confirms the move.
  const approveSelected = async () => {
    const toApprove = unapprovedQueue.filter((q) => selectedIds.has(q.id));
    if (toApprove.length === 0) return;
    await onApproveSelected(toApprove);
    rememberItems(toApprove);
    setUnapprovedQueue((prev) => prev.filter((q) => !selectedIds.has(q.id)));
    setSelectedIds(new Set());
    setQueueToast(`✓ Approved ${toApprove.length} question${toApprove.length > 1 ? 's' : ''}.`);
    setTimeout(() => setQueueToast(null), 2200);
  };

  // Explicit, user-initiated removal — discards a single card from the queue entirely.
  const removeQueueItem = (id: string) => {
    setUnapprovedQueue((prev) => prev.filter((q) => q.id !== id));
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (editingId === id) resetForm();
  };

  const saveQueueItemEdit = (updated: MCQItem) => {
    setUnapprovedQueue((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  };

  // Build the MCQItem from the current form state (shared by submit + bank import)
  const buildFormItem = (): MCQItem => {
    const keyLabels = ['ক', 'খ', 'গ', 'ঘ'];
    const formattedOptions = options.map((optText, idx) => ({
      key: keyLabels[idx] || `${idx + 1}`,
      text: optText || `Option ${idx + 1}`,
      isCorrect: (keyLabels[idx] || '').toLowerCase() === answerKey.toLowerCase(),
    }));

    return {
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
      source: sourceTags.length > 0 ? sourceTags : undefined,
      tags: {
        subject: tagSubject || undefined,
        className: tagClass || undefined,
        paper: tagPaper || undefined,
      },
      explanation: explanation || undefined,
      confidence: 'high',
    };
  };

  // Form submit: Adds a new MCQ OR updates existing item in Queue or Active Deck!
  const handleAddOrUpdateSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stem.trim()) return;

    const updatedItem = buildFormItem();
    rememberItems([updatedItem]);

    if (editingItemTarget === 'queue') {
      // Update in unapproved queue
      setUnapprovedQueue((prev) => prev.map((q) => (q.id === editingId ? updatedItem : q)));
      setFormNotice('Question updated in the Review Queue.');
    } else {
      // New question → stage it for a batch commit into the review queue
      setStagedItems((prev) => [...prev, updatedItem]);
      setFormNotice(`Question saved to the batch (${stagedItems.length + 1} staged). Keep adding more or commit below.`);
    }

    resetForm();
  };

  // Remove a single staged question from the batch list.
  const removeStagedItem = (id: string) => {
    setStagedItems((prev) => prev.filter((q) => q.id !== id));
  };

  // Commit every staged question into the Review Queue in one shot.
  const commitStagedToQueue = () => {
    if (stagedItems.length === 0) return;
    setUnapprovedQueue((prev) => [...prev, ...stagedItems]);
    rememberItems(stagedItems);
    const count = stagedItems.length;
    setStagedItems([]);
    setFormNotice(`✓ ${count} MCQ${count > 1 ? 's' : ''} added to the Review Queue.`);
  };

  const insertSnippet = (snippet: string) => {
    setBulkText((prev) => (prev ? `${prev}\n\n${snippet}` : snippet));
  };

  const [aiPromptCopied, setAiPromptCopied] = useState(false);
  const handleCopyAiPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_TRANSCRIBE_PROMPT);
      setAiPromptCopied(true);
      setTimeout(() => setAiPromptCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  // Alias kept for readability at call sites below — every item still in the
  // queue is "pending" now that approved items leave the list entirely.
  const pendingQueueItems = unapprovedQueue;

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
            Paste raw exam text or a CSV, review what gets parsed, then send it to your deck — two steps, start to finish.
          </p>
        </div>
      </div>

      {/* Guided Step Flow: Paste → Review. "Add one manually" is a separate, secondary path. */}
      <div className={`flex flex-wrap items-center justify-between gap-4 border-b pb-5 ${isAppLight ? 'border-slate-200' : 'border-slate-700/50'}`}>
        <div className="flex items-center gap-2.5">
          {/* Step 1 */}
          <button
            onClick={() => { setActiveSubTab('bulk'); setFormNotice(null); }}
            className={`flex items-center gap-2.5 pl-2.5 pr-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
              activeSubTab === 'bulk'
                ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-md font-black'
                : isAppLight
                ? 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'
                : 'bg-slate-950/40 border-slate-700/50 text-slate-300 hover:text-white hover:border-amber-500/40'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
              activeSubTab === 'bulk'
                ? 'bg-slate-950 text-amber-400'
                : parsedPreview.length > 0 || unapprovedQueue.length > 0
                ? 'bg-emerald-500 text-slate-950'
                : isAppLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-400'
            }`}>
              {activeSubTab !== 'bulk' && (parsedPreview.length > 0 || unapprovedQueue.length > 0) ? <Check className="w-3 h-3 stroke-[3]" /> : '1'}
            </span>
            <FileText className="w-4 h-4" />
            <span>Paste & Parse</span>
          </button>

          {/* Connector */}
          <div className={`w-6 sm:w-10 h-px shrink-0 ${isAppLight ? 'bg-slate-300' : 'bg-slate-700'}`} />

          {/* Step 2 */}
          <button
            onClick={() => { setActiveSubTab('review'); setFormNotice(null); }}
            className={`flex items-center gap-2.5 pl-2.5 pr-4 py-2 rounded-2xl text-xs font-bold transition-all relative cursor-pointer border ${
              activeSubTab === 'review'
                ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-md font-black'
                : isAppLight
                ? 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'
                : 'bg-slate-950/40 border-slate-700/50 text-slate-300 hover:text-white hover:border-amber-500/40'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
              activeSubTab === 'review'
                ? 'bg-slate-950 text-amber-400'
                : isAppLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-400'
            }`}>
              2
            </span>
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Review & Add to Deck</span>
            {pendingQueueItems.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-black ${
                activeSubTab === 'review' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950 animate-pulse'
              }`}>
                {pendingQueueItems.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveSubTab('single'); setFormNotice(null); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border border-dashed ${
              activeSubTab === 'single'
                ? isAppLight
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                  : 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300'
                : isAppLight
                ? 'border-slate-300 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
                : 'border-slate-700 text-slate-400 hover:border-indigo-500/40 hover:text-indigo-300'
            }`}
            title="Skip pasting — type a single question from scratch"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add one manually</span>
            {editingId && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black">
                Editing
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: BULK PASTE & CSV IMPORT */}
      {activeSubTab === 'bulk' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Bulk Text Area */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Paste Raw MCQs Text Here
              </label>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  Bengali, English, LaTeX math ($x^2$), & Bohupodi
                </span>
                <div className={`inline-flex items-center rounded-xl border p-1 gap-1 ${
                  isAppLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/40 border-slate-700/50'
                }`}>
                  <button
                    type="button"
                    onClick={() => setBulkViewMode('raw')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      bulkViewMode === 'raw'
                        ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                        : isAppLight
                        ? 'text-slate-600 hover:bg-slate-200'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Raw Text</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkViewMode('cards')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      bulkViewMode === 'cards'
                        ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                        : isAppLight
                        ? 'text-slate-600 hover:bg-slate-200'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Cards ({parsedPreview.length})</span>
                  </button>
                </div>
              </div>
            </div>

            {bulkViewMode === 'raw' ? (
              <div className="relative">
                <textarea
                  ref={bulkTextRef}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  onPaste={() => { justPastedBulkRef.current = true; }}
                  placeholder="Paste questions here... e.g. 1. Question stem? A) Opt 1 B) Opt 2 * C) Opt 3 D) Opt 4"
                  className={`w-full h-[28rem] font-['Hind_Siliguri',sans-serif] p-5 rounded-2xl border focus:outline-none focus:border-amber-500 text-base leading-relaxed resize-none shadow-inner ${
                    isAppLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-800 text-slate-100'
                  }`}
                />
                <MathHelperButton
                  value={bulkText}
                  onChange={setBulkText}
                  inputRef={bulkTextRef}
                  isAppLight={isAppLight}
                  label="pasted questions"
                  className="absolute top-3 right-3"
                />
              </div>
            ) : (
              <div className={`w-full max-h-[36rem] overflow-y-auto rounded-2xl border p-3 space-y-3 shadow-inner ${
                isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
              }`}>
                {parseBulkTextToBlocks(bulkText).length === 0 ? (
                  <div className={`rounded-xl border border-dashed p-6 text-center text-xs ${
                    isAppLight ? 'border-slate-300 text-slate-400' : 'border-slate-800 text-slate-500'
                  }`}>
                    No questions yet — switch to Raw Text and paste, or add one below.
                  </div>
                ) : (
                  parseBulkTextToBlocks(bulkText).map(({ item }, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl space-y-3 ${
                        isAppLight
                          ? 'bg-white border-2 border-slate-300 text-slate-950 shadow-sm'
                          : 'bg-slate-900 border-2 border-slate-700 text-slate-100 shadow-md'
                      }`}
                    >
                      {/* Header: number badge + delete */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeBlock(idx)}
                          className={`p-2 rounded-xl border cursor-pointer transition-colors ${
                            isAppLight ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                          }`}
                          title="Remove this card"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Stem */}
                      <div>
                        <label className={`block text-[11px] font-bold mb-1 uppercase tracking-wider ${
                          isAppLight ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          Question Stem
                        </label>
                        <textarea
                          value={item.stem}
                          onChange={(e) => patchBlockItem(idx, { stem: e.target.value })}
                          rows={2}
                          className={`${queueInputCls} resize-none leading-relaxed`}
                        />
                      </div>

                      {/* Bohupodi roman items */}
                      {item.questionType === 'roman_statements' && (
                        <div className={`space-y-2 p-3 rounded-2xl border ${
                          isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                        }`}>
                          <label className="block text-[11px] font-bold text-amber-500 uppercase tracking-wider">
                            Roman Statements (i. ii. iii.)
                          </label>
                          {(item.romanItems || []).map((ri, riIdx) => (
                            <input
                              key={riIdx}
                              type="text"
                              value={ri}
                              onChange={(e) => {
                                const updated = [...(item.romanItems || [])];
                                updated[riIdx] = e.target.value;
                                patchBlockItem(idx, { romanItems: updated });
                              }}
                              className={queueInputCls}
                            />
                          ))}
                          <input
                            type="text"
                            value={item.prompt || ''}
                            onChange={(e) => patchBlockItem(idx, { prompt: e.target.value })}
                            placeholder="Prompt e.g. নিচের কোনটি সঠিক?"
                            className={`${queueInputCls} ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}
                          />
                        </div>
                      )}

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.options.map((opt) => {
                          const isCorrect = opt.key.toLowerCase() === (item.answer || '').toLowerCase();
                          return (
                            <div
                              key={opt.key}
                              className={`flex items-center gap-2 p-2 rounded-xl border ${
                                isCorrect
                                  ? 'bg-emerald-500/10 border-emerald-500/40'
                                  : isAppLight
                                  ? 'bg-white border-slate-200'
                                  : 'bg-slate-900 border-slate-800'
                              }`}
                            >
                              <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                                {opt.key}
                              </span>
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => patchBlockOption(idx, opt.key, e.target.value)}
                                className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border text-sm focus:outline-none focus:border-amber-500 bg-transparent"
                              />
                              <button
                                type="button"
                                onClick={() => setBlockAnswer(idx, opt.key)}
                                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer shrink-0 ${
                                  isCorrect
                                    ? 'bg-emerald-500 text-slate-950'
                                    : isAppLight
                                    ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {isCorrect ? '✓ Correct' : 'Answer'}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Source + explanation */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className={`block text-[11px] font-bold mb-1 uppercase tracking-wider ${
                            isAppLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            Source Tags (Board / Exam)
                          </label>
                          <SourceTagsInput
                            tags={getSourceTags(item)}
                            onChange={(tags) => patchBlockItem(idx, { source: tags.length > 0 ? tags : undefined })}
                            theme={isAppLight ? 'light' : 'dark'}
                          />
                        </div>
                        <div>
                          <label className={`block text-[11px] font-bold mb-1 uppercase tracking-wider ${
                            isAppLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            Explanation
                          </label>
                          <input
                            type="text"
                            value={item.explanation || ''}
                            onChange={(e) => patchBlockItem(idx, { explanation: e.target.value || undefined })}
                            placeholder="Optional explanation"
                            className={queueInputCls}
                          />
                        </div>
                      </div>

                      {/* Structured tags */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className={`block text-[11px] font-bold mb-1 uppercase tracking-wider ${
                            isAppLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            Subject
                          </label>
                          <TagChipSelect
                            value={item.tags?.subject || ''}
                            onChange={(v) => patchBlockItem(idx, { tags: { ...(item.tags || {}), subject: v || undefined } })}
                            suggestions={memory.subjects}
                            placeholder="e.g. Biology"
                            theme={isAppLight ? 'light' : 'dark'}
                          />
                        </div>
                        <div>
                          <label className={`block text-[11px] font-bold mb-1 uppercase tracking-wider ${
                            isAppLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            Class
                          </label>
                          <TagChipSelect
                            value={item.tags?.className || ''}
                            onChange={(v) => patchBlockItem(idx, { tags: { ...(item.tags || {}), className: v || undefined } })}
                            suggestions={memory.classes}
                            placeholder="e.g. SSC / HSC"
                            theme={isAppLight ? 'light' : 'dark'}
                          />
                        </div>
                        <div>
                          <label className={`block text-[11px] font-bold mb-1 uppercase tracking-wider ${
                            isAppLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            Paper
                          </label>
                          <TagChipSelect
                            value={item.tags?.paper || ''}
                            onChange={(v) => patchBlockItem(idx, { tags: { ...(item.tags || {}), paper: v || undefined } })}
                            suggestions={memory.papers}
                            placeholder="e.g. 1st Paper"
                            theme={isAppLight ? 'light' : 'dark'}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onClick={addBlankCard}
                  className={`w-full px-4 py-3 rounded-2xl border-2 border-dashed text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    isAppLight
                      ? 'border-slate-300 text-slate-500 hover:border-amber-400 hover:text-amber-600'
                      : 'border-slate-700 text-slate-400 hover:border-amber-500/50 hover:text-amber-400'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Question</span>
                </button>
              </div>
            )}

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
              <button
                type="button"
                onClick={() =>
                  insertSnippet(
                    `৪. সালোকসংশ্লেষণ কোথায় ঘটে?\nক) মাইটোকন্ড্রিয়ায়\nখ) ক্লোরোপ্লাস্টে *\nগ) রাইবোজোমে\nঘ) নিউক্লিয়াসে\nব্যাখ্যা: সালোকসংশ্লেষণ ক্লোরোপ্লাস্টের গ্রানায় ঘটে, যেখানে ক্লোরোফিল অবস্থান করে।\n[ঢাকা বোর্ড ২০২৩]`
                  )
                }
                className={`text-xs px-3 py-1.5 rounded-xl border font-semibold ${
                  isAppLight
                    ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title="Shows the optional ব্যাখ্যা: explanation + [source] format"
              >
                + MCQ with Explanation
              </button>
              <button
                type="button"
                onClick={() =>
                  insertSnippet(
                    `৫. কোষ বিভাজনের ফলে কতটি অপত্য কোষ সৃষ্টি হয়?\nক) ১টি\nখ) ২টি *\nগ) ৩টি\nঘ) ৪টি\n[ঢাকা বোর্ড ২০২২]\nsubject: জীববিজ্ঞান\nclass: SSC\npaper: 1st Paper`
                  )
                }
                className={`text-xs px-3 py-1.5 rounded-xl border font-semibold ${
                  isAppLight
                    ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title="Shows the optional subject: / class: / paper: category lines"
              >
                + MCQ with Subject/Class/Paper
              </button>
            </div>

            {/* Batch Tags — interactive editor, applied to every parsed MCQ */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                  <Tags className="w-4 h-4" /> Batch Tags
                  <span className="text-[10px] font-semibold normal-case text-slate-400 font-sans">
                    applied to every parsed MCQ
                  </span>
                </label>
                {(batchSourceTags.length > 0 || batchSubject || batchClass || batchPaper) && (
                  <button
                    type="button"
                    onClick={clearBatchTags}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold border cursor-pointer transition-colors ${
                      isAppLight
                        ? 'bg-white border-slate-300 text-slate-500 hover:text-rose-500 hover:border-rose-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/40'
                    }`}
                  >
                    <X className="w-3 h-3 inline mr-1" />Clear batch tags
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Source Tags (Board / Exam) — multiple allowed
                  </label>
                  <SourceTagsInput
                    tags={batchSourceTags}
                    onChange={setBatchSourceTags}
                    theme={isAppLight ? 'light' : 'dark'}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Subject (single)
                  </label>
                  <TagChipSelect
                    value={batchSubject}
                    onChange={(v) => {
                      setBatchSubject(v);
                      if (v) remember({ subject: v });
                    }}
                    suggestions={memory.subjects}
                    placeholder="e.g. Biology"
                    theme={isAppLight ? 'light' : 'dark'}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Class (single)
                  </label>
                  <TagChipSelect
                    value={batchClass}
                    onChange={(v) => {
                      setBatchClass(v);
                      if (v) remember({ className: v });
                    }}
                    suggestions={memory.classes}
                    placeholder="e.g. SSC / HSC"
                    theme={isAppLight ? 'light' : 'dark'}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Paper (single)
                  </label>
                  <TagChipSelect
                    value={batchPaper}
                    onChange={(v) => {
                      setBatchPaper(v);
                      if (v) remember({ paper: v });
                    }}
                    suggestions={memory.papers}
                    placeholder="e.g. 1st Paper"
                    theme={isAppLight ? 'light' : 'dark'}
                  />
                </div>
              </div>
            </div>

            {/* Workspace default tags — opt-in, off by default. Only fills blank
                tag fields on parse; never overwrites a question's own tags. */}
            {defaultTags && (defaultTags.subject || defaultTags.className || defaultTags.paper) && (
              <label
                className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer ${
                  isAppLight ? 'bg-emerald-50 border-emerald-300' : 'bg-emerald-500/10 border-emerald-500/30'
                }`}
              >
                <input
                  type="checkbox"
                  checked={applyWorkspaceDefaultTags}
                  onChange={onToggleApplyWorkspaceDefaultTags}
                  className="accent-emerald-500 w-4 h-4"
                />
                <span className={`text-xs font-bold ${isAppLight ? 'text-emerald-800' : 'text-emerald-300'}`}>
                  Apply workspace default tags ({[defaultTags.subject, defaultTags.className, defaultTags.paper].filter(Boolean).join(' · ')}) — fills only blank tag fields
                </span>
              </label>
            )}

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
                  Step 2: Send {parsedPreview.length} MCQ{parsedPreview.length === 1 ? '' : 's'} to Review →
                </span>
              </button>
            </div>

            {/* Live Parse Preview — mock slide of the first parsed question (Raw Text mode only; Cards mode IS the live preview) */}
            {bulkViewMode === 'raw' && (
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
                      className={`relative rounded-2xl p-4 space-y-3 ${
                        isAppLight
                          ? 'bg-white border-2 border-slate-300 text-slate-950 shadow-sm'
                          : 'bg-slate-950 border-2 border-slate-700 text-slate-100 shadow-md'
                      }`}
                    >
                      {/* Question number badge */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center shrink-0 shadow-xs">
                            {idx + 1}
                          </span>
                          <div className={`text-base font-black leading-relaxed ${isAppLight ? 'text-slate-950' : 'text-white'}`}>
                            <MathText text={mcq.stem} />
                          </div>
                        </div>
                        <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-xl shrink-0 ${
                          mcq.questionType === 'roman_statements'
                            ? 'bg-violet-500/20 text-violet-700 dark:text-violet-300'
                            : mcq.questionType === 'passage'
                              ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300'
                              : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
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
                        <div className={`my-2 p-3.5 rounded-2xl space-y-1 ${
                          isAppLight ? 'bg-slate-100/70 text-slate-950' : 'bg-slate-900/70 text-slate-100'
                        }`}>
                          {mcq.romanItems.map((ri, riIdx) => (
                            <div key={riIdx} className="text-sm font-bold">
                              <MathText text={ri} />
                            </div>
                          ))}
                          {mcq.prompt && (
                            <div className={`text-sm font-black italic pt-1 ${
                              isAppLight ? 'text-amber-800' : 'text-amber-300'
                            }`}>
                              <MathText text={mcq.prompt} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-2">
                        {mcq.options.map((opt) => {
                          const isCorrect = opt.isCorrect || opt.key.toLowerCase() === mcq.answer?.toLowerCase();
                          return (
                            <div
                              key={opt.key}
                              className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
                                isCorrect
                                  ? isAppLight
                                    ? 'bg-emerald-500/15 text-emerald-950 ring-1 ring-emerald-500/30 shadow-2xs'
                                    : 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30 shadow-2xs'
                                  : isAppLight
                                    ? 'bg-slate-100/80 text-slate-950'
                                    : 'bg-slate-900/80 text-slate-100'
                              }`}
                            >
                              <span className={`font-black font-mono text-xs px-2 py-0.5 rounded-lg shrink-0 ${
                                isCorrect ? 'bg-emerald-500 text-slate-950' : isAppLight ? 'bg-amber-500 text-slate-950' : 'bg-amber-500/30 text-amber-300'
                              }`}>
                                {opt.key}.
                              </span>
                              <span className="flex-1 min-w-0 truncate">
                                <MathText text={opt.text} />
                              </span>
                              {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>

                      {/* Answer key + tags footer */}
                      <div className="flex items-center justify-between gap-3 mt-2.5 pt-2 border-t border-dashed ${
                        isAppLight ? 'border-slate-300' : 'border-slate-800'
                      }">
                        <span className="text-xs font-black font-mono px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 shadow-2xs">
                          ✓ Ans: {mcq.answer}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {mcq.tags?.subject && (
                            <span className={`px-2.5 py-1 rounded-xl font-mono font-extrabold text-xs ${
                              isAppLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-slate-300'
                            }`}>
                              📌 {mcq.tags.subject}
                            </span>
                          )}
                          {mcq.tags?.className && (
                            <span className={`px-2.5 py-1 rounded-xl font-mono font-extrabold text-xs ${
                              isAppLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-slate-300'
                            }`}>
                              🏫 {mcq.tags.className}
                            </span>
                          )}
                          {mcq.tags?.paper && (
                            <span className={`px-2.5 py-1 rounded-xl font-mono font-extrabold text-xs ${
                              isAppLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-slate-300'
                            }`}>
                              📄 {mcq.tags.paper}
                            </span>
                          )}
                          {getSourceTags(mcq).length > 0 && (
                            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-xl ${isAppLight ? 'bg-amber-100 text-amber-950' : 'bg-amber-500/20 text-amber-300'}`}>
                              <MathText text={`[${getSourceTags(mcq).join(' | ')}]`} />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Optional explanation indicator */}
                      {mcq.explanation && (
                        <div className={`mt-2.5 p-3 rounded-2xl text-xs lg:text-sm font-bold leading-relaxed flex items-start gap-2.5 ${
                          isAppLight
                            ? 'bg-sky-50/90 text-sky-950'
                            : 'bg-sky-500/10 text-sky-200'
                        }`}>
                          <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-sky-500" />
                          <span className="min-w-0 flex-1">
                            <span className="font-black text-sky-700 dark:text-sky-400 mr-1.5">ব্যাখ্যা:</span>
                            <MathText text={mcq.explanation} />
                          </span>
                        </div>
                      )}
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
            )}
          </div>

          {/* Format Helper Sidebar & CSV Import */}
          <div
            className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 border text-xs flex flex-col gap-4 ${
              isAppLight
                ? 'border-slate-200'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            {/* AI Image/PDF → Raw Text Transcription Prompt */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-900/10 border border-violet-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-violet-400" />
                <h4 className={`font-extrabold text-xs uppercase tracking-wider ${isAppLight ? 'text-violet-700' : 'text-violet-400'}`}>
                  Scan Image / PDF → Parser-Ready Text
                </h4>
              </div>
              <p className={`text-[11px] leading-snug ${isAppLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Have a question-paper photo or PDF? Paste this prompt into any AI (ChatGPT,
                Gemini, Claude…), upload your file there, and it will return the{" "}
                <code className="font-mono font-bold">exact raw text</code> this parser
                understands — including answers (<code className="font-mono font-bold">*</code>),{" "}
                <code className="font-mono font-bold">ব্যাখ্যা:</code> explanations,{" "}
                <code className="font-mono font-bold">i. ii. iii.</code> বহুপদী,{" "}
                <code className="font-mono font-bold">[source]</code> tags, and — when it can
                infer them confidently from the paper — the{" "}
                <code className="font-mono font-bold">subject:</code> /{" "}
                <code className="font-mono font-bold">class:</code> /{" "}
                <code className="font-mono font-bold">paper:</code> category lines.
              </p>
              <button
                type="button"
                onClick={handleCopyAiPrompt}
                className={`w-full py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  aiPromptCopied
                    ? 'bg-emerald-500 border-emerald-400 text-white'
                    : 'bg-violet-500 hover:bg-violet-400 text-white border-violet-400 shadow-md'
                }`}
              >
                {aiPromptCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Prompt Copied!</span>
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="w-4 h-4" />
                    <span>Copy AI Transcription Prompt</span>
                  </>
                )}
              </button>
            </div>

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
                with columns: <code className="font-mono font-bold">stem, A, B, C, D, correct</code>{" "}
                — plus optional <code className="font-mono font-bold">explanation</code>,{" "}
                <code className="font-mono font-bold">source</code>,{" "}
                <code className="font-mono font-bold">subject</code>,{" "}
                <code className="font-mono font-bold">class</code> and{" "}
                <code className="font-mono font-bold">paper</code> columns.
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

              <div
                className={`p-3 rounded-xl border ${
                  isAppLight
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <p className="font-bold mb-1">4. Optional Explanation</p>
                <p className="text-slate-400">
                  Add a line starting with{' '}
                  <code className="text-amber-500 font-mono">ব্যাখ্যা:</code> (or{' '}
                  <code className="text-amber-500 font-mono">exp:</code> /{' '}
                  <code className="text-amber-500 font-mono">Explanation:</code>) after the
                  options — it becomes the slide's explanation box.
                </p>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isAppLight
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <p className="font-bold mb-1">5. Source Tag</p>
                <p className="text-slate-400">
                  Wrap a board/exam name in brackets, e.g.{' '}
                  <code className="text-amber-500 font-mono">[ঢাকা বোর্ড ২০২৪]</code>
                </p>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isAppLight
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <p className="font-bold mb-1">6. Subject / Class / Paper (Optional)</p>
                <p className="text-slate-400">
                  Add tag lines like{' '}
                  <code className="text-amber-500 font-mono">subject: জীববিজ্ঞান</code>,{' '}
                  <code className="text-amber-500 font-mono">class: SSC</code>,{' '}
                  <code className="text-amber-500 font-mono">paper: 1st Paper</code> — they
                  become the question's category tags.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: QUESTION REVIEWER QUEUE (Review, Edit & Approve Gatekeeper) */}
      {activeSubTab === 'review' && (
        <div className="space-y-6">
          {queueToast && (
            <div className={`flex items-center gap-2.5 p-3.5 rounded-2xl text-xs font-bold ${
              isAppLight ? 'bg-emerald-50 border border-emerald-300 text-emerald-800' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{queueToast}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30">
            <div>
              <h3 className="text-base font-black text-amber-500 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Step 2: Review Queue ({pendingQueueItems.length} Pending)
              </h3>
              <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Click a card to select it (it turns green), fix anything the parser missed with Edit, then approve your selection.
              </p>
            </div>

            {unapprovedQueue.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setUnapprovedQueue([]); setSelectedIds(new Set()); }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 border border-slate-700 cursor-pointer"
                  title="Removes every card from this queue"
                >
                  Clear Queue
                </button>
                <button
                  type="button"
                  onClick={selectedIds.size === unapprovedQueue.length ? deselectAll : selectAll}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs border cursor-pointer transition-all ${
                    isAppLight ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {selectedIds.size === unapprovedQueue.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  type="button"
                  onClick={approveSelected}
                  disabled={selectedIds.size === 0}
                  className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Selected ({selectedIds.size})</span>
                </button>
              </div>
            )}
          </div>

          {unapprovedQueue.length === 0 ? (
            <div className={`text-center py-16 space-y-3 rounded-3xl border border-dashed ${isAppLight ? 'border-slate-300' : 'border-slate-700'}`}>
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 stroke-[1.5]" />
              <h4 className={`text-base font-bold ${isAppLight ? 'text-slate-700' : 'text-slate-200'}`}>Nothing waiting for review</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Paste text or a CSV in Step 1, or run the AI PDF Parser, to send MCQs here for review.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('bulk')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back to Step 1: Paste & Parse</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {unapprovedQueue.map((item, idx) => (
                <EditableMCQCard
                  key={item.id}
                  item={item}
                  index={idx}
                  isAppLight={isAppLight}
                  mode="select"
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={() => toggleSelect(item.id)}
                  onSave={saveQueueItemEdit}
                  onRemove={() => removeQueueItem(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: FORM QUESTION CREATOR & EDITOR */}
      {activeSubTab === 'single' && (
        <form ref={formRef} onSubmit={handleAddOrUpdateSingle} className="space-y-6 max-w-4xl">
          {/* Banner showing if we are editing an existing question */}
          {editingId ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-bold text-emerald-400">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                <span>Editing Question (Source: Review Queue)</span>
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
                Source Tags (Board / Exam):
              </label>
              <SourceTagsInput
                tags={sourceTags}
                onChange={setSourceTags}
                theme={isAppLight ? 'light' : 'dark'}
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

          {/* Structured Tags: Subject / Class / Paper */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Structured Tags (Subject / Class / Paper)
              </label>
              {lastItemTags && (
                <button
                  type="button"
                  onClick={useLastItemTags}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                    isAppLight
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100'
                      : 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20'
                  }`}
                  title={`Copy tags from the last deck question: ${lastItemTags.stem.slice(0, 40)}…`}
                >
                  <History className="w-3.5 h-3.5" />
                  Use Last Question's Tags
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Subject Tag (Optional):
                </label>
                <TagChipSelect
                  value={tagSubject}
                  onChange={(v) => {
                    setTagSubject(v);
                    if (v) remember({ subject: v });
                  }}
                  suggestions={memory.subjects}
                  placeholder="e.g. Biology / জীববিজ্ঞান"
                  theme={isAppLight ? 'light' : 'dark'}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Class Tag (Optional):
                </label>
                <TagChipSelect
                  value={tagClass}
                  onChange={(v) => {
                    setTagClass(v);
                    if (v) remember({ className: v });
                  }}
                  suggestions={memory.classes}
                  placeholder="e.g. SSC / HSC / Class 9"
                  theme={isAppLight ? 'light' : 'dark'}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Paper Tag (Optional):
                </label>
                <TagChipSelect
                  value={tagPaper}
                  onChange={(v) => {
                    setTagPaper(v);
                    if (v) remember({ paper: v });
                  }}
                  suggestions={memory.papers}
                  placeholder="e.g. 1st Paper / 2nd Paper"
                  theme={isAppLight ? 'light' : 'dark'}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-8 py-3.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg hover:brightness-110 cursor-pointer"
            >
              {editingId ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              <span>{editingId ? 'Save & Update Question' : 'Save Question to Batch'}</span>
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

      {/* Success / info notice from the Form Question Creator */}
      {formNotice && (
        <div className={`flex items-center justify-between gap-3 p-4 rounded-2xl border ${
          isAppLight ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
        }`}>
          <p className="text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{formNotice}</span>
          </p>
          <button
            type="button"
            onClick={() => setFormNotice(null)}
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
              isAppLight ? 'text-emerald-600 hover:bg-emerald-100' : 'text-emerald-400 hover:bg-emerald-500/20'
            }`}
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Staged question batch — created in the Form Question Creator, waiting to
          be committed to the Active Deck or the Question Bank in one shot. */}
      {stagedItems.length > 0 && (
        <div className={`p-5 rounded-3xl border space-y-3 ${
          isAppLight ? 'bg-indigo-50/60 border-indigo-300' : 'bg-slate-950 border-indigo-500/40'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl font-black ${isAppLight ? 'bg-indigo-500 text-white' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'}`}>
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className={`text-sm font-black uppercase tracking-wider ${isAppLight ? 'text-indigo-700' : 'text-indigo-300'}`}>
                  Staged Batch ({stagedItems.length})
                </h4>
                <p className={`text-[11px] ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Questions below are saved locally — commit them all to your deck or the question bank.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setStagedItems([])}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                  isAppLight ? 'bg-white border-slate-300 text-slate-500 hover:text-rose-600 hover:border-rose-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/40'
                }`}
              >
                Discard All
              </button>
              <button
                type="button"
                onClick={commitStagedToQueue}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/25 cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Commit All ({stagedItems.length}) → Review Queue
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {stagedItems.map((item, idx) => (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                  isAppLight ? 'bg-white border-indigo-200 text-slate-900' : 'bg-slate-900 border-indigo-500/30 text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate max-w-[420px]">
                      <MathText text={item.stem} />
                    </p>
                    <span className={`text-[10px] font-mono font-semibold ${isAppLight ? 'text-indigo-600' : 'text-indigo-300'}`}>
                      Ans: {item.answer}
                      {getSourceTags(item).length > 0 ? ` • ${getSourceTags(item).join(' | ')}` : ''}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeStagedItem(item.id)}
                  className={`p-2 rounded-lg cursor-pointer transition-colors shrink-0 ${
                    isAppLight ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10'
                  }`}
                  title="Remove from batch"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
