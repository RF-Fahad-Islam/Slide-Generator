import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface SourceTagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  theme?: 'dark' | 'light';
}

export const SourceTagsInput: React.FC<SourceTagsInputProps> = ({ tags, onChange, theme = 'dark' }) => {
  const [draft, setDraft] = useState('');
  const isLight = theme === 'light';

  const addTag = (raw: string) => {
    const trimmed = raw.trim().replace(/[|,;]+$/, '');
    if (!trimmed) return;
    const parts = trimmed.split(/\s*\|\s*|\s*,\s*/).map((p) => p.trim()).filter(Boolean);
    const existing = new Set(tags.map((t) => t.toLowerCase()));
    const next = [...tags];
    parts.forEach((p) => {
      if (!existing.has(p.toLowerCase())) {
        next.push(p);
        existing.add(p.toLowerCase());
      }
    });
    onChange(next);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (draft.trim()) addTag(draft);
      setDraft('');
    } else if (e.key === 'Backspace' && !draft && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div
      className={`w-full min-h-[42px] px-2.5 py-1.5 rounded-xl border text-sm flex flex-wrap items-center gap-1.5 focus-within:border-amber-500 ${
        isLight
          ? 'bg-white border-slate-300 text-slate-900'
          : 'bg-slate-950 border-slate-800 text-white'
      }`}
    >
      {tags.map((tag, idx) => (
        <span
          key={`${tag}-${idx}`}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border ${
            isLight
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(idx)}
            className="hover:text-white cursor-pointer"
            aria-label={`Remove ${tag}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (draft.trim()) addTag(draft);
          setDraft('');
        }}
        placeholder={tags.length === 0 ? 'e.g. ঢাকা বোর্ড ২০২৪, DU Admission 2023' : 'Add tag…'}
        className="flex-1 min-w-[120px] bg-transparent focus:outline-none text-sm placeholder:text-slate-500"
      />
    </div>
  );
};
