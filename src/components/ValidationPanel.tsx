import React from 'react';
import { MCQItem } from '../types';
import { AlertTriangle, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export interface ValidationIssue {
  itemId: string;
  itemIndex: number;
  stemSnippet: string;
  type: 'error' | 'warning';
  message: string;
}

interface ValidationPanelProps {
  items: MCQItem[];
  onSelectItem: (index: number) => void;
}

export function validateDeck(items: MCQItem[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  items.forEach((item, index) => {
    const stemSnippet = item.stem ? (item.stem.length > 35 ? item.stem.substring(0, 35) + '...' : item.stem) : `Question ${index + 1}`;

    // 1. Missing correct answer check
    const hasCorrect = item.options.some(o => o.isCorrect) || (item.answer && item.answer.trim().length > 0);
    if (!hasCorrect) {
      issues.push({
        itemId: item.id,
        itemIndex: index,
        stemSnippet,
        type: 'error',
        message: 'No correct answer marked for this question.',
      });
    }

    // 2. Unconfirmed AI inferred answer
    if (item.confidence === 'low' || (item.warnings && item.warnings.length > 0)) {
      issues.push({
        itemId: item.id,
        itemIndex: index,
        stemSnippet,
        type: 'warning',
        message: item.warnings?.[0] || 'AI low confidence: Please confirm the correct answer manually.',
      });
    }

    // 3. Duplicate options text
    const optTexts = item.options.map(o => o.text.trim().toLowerCase()).filter(Boolean);
    const uniqueOptTexts = new Set(optTexts);
    if (uniqueOptTexts.size < optTexts.length) {
      issues.push({
        itemId: item.id,
        itemIndex: index,
        stemSnippet,
        type: 'warning',
        message: 'Contains duplicate option text choices.',
      });
    }

    // 4. Blank options
    const hasBlankOption = item.options.some(o => !o.text.trim());
    if (hasBlankOption) {
      issues.push({
        itemId: item.id,
        itemIndex: index,
        stemSnippet,
        type: 'error',
        message: 'Has one or more empty/blank option texts.',
      });
    }

    // 5. Overlong stem warning for slide fit
    if (item.stem && item.stem.length > 220) {
      issues.push({
        itemId: item.id,
        itemIndex: index,
        stemSnippet,
        type: 'warning',
        message: 'Question stem is very long (>220 chars) and may shrink font on 16:9 slide.',
      });
    }
  });

  return issues;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ items, onSelectItem }) => {
  const issues = validateDeck(items);
  const errorsCount = issues.filter(i => i.type === 'error').length;
  const warningsCount = issues.filter(i => i.type === 'warning').length;

  if (issues.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <strong className="font-bold text-sm block">Deck Health: Pristine</strong>
            <span>All {items.length} questions have correct answers, valid options, & clean formatting.</span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold uppercase tracking-wider">
          100% Ready
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            Deck Quality Inspector ({issues.length} Issues)
          </h4>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold">
          {errorsCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {errorsCount} Errors
            </span>
          )}
          {warningsCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {warningsCount} Warnings
            </span>
          )}
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {issues.map((issue, idx) => (
          <button
            key={`${issue.itemId}_${idx}`}
            onClick={() => onSelectItem(issue.itemIndex)}
            className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-start justify-between gap-3 transition-all hover:brightness-110 cursor-pointer ${
              issue.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-slate-950 font-mono text-[10px] font-bold text-slate-300 border border-slate-800">
                  Q{issue.itemIndex + 1}
                </span>
                <span className="font-bold truncate text-slate-100">{issue.stemSnippet}</span>
              </div>
              <p className="text-[11px] opacity-90 leading-tight">{issue.message}</p>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 shrink-0 mt-0.5">
              <span>Fix</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
