import React, { useState, KeyboardEvent } from 'react';
import { X, Check } from 'lucide-react';

interface TagChipSelectProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  theme?: 'dark' | 'light';
}

/**
 * Single-select chip picker (like the multi SourceTagsInput but only one value can
 * be selected). Suggestion chips come from the remembered tag memory; a free-text
 * input lets you commit a custom value too. Clicking a selected chip clears it.
 */
export const TagChipSelect: React.FC<TagChipSelectProps> = ({
  value,
  onChange,
  suggestions,
  placeholder = 'Type & press Enter…',
  theme = 'dark',
}) => {
  const [draft, setDraft] = useState('');
  const isLight = theme === 'light';

  const commitDraft = () => {
    const trimmed = draft.trim();
    if (trimmed) onChange(trimmed);
    setDraft('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitDraft();
    } else if (e.key === 'Backspace' && !draft && value) {
      onChange('');
    }
  };

  const isSelected = (s: string) => s.trim().toLowerCase() === value.trim().toLowerCase();
  const hasMatchingSuggestion = value.trim() !== '' && suggestions.some((s) => isSelected(s));

  return (
    <div
      className={`w-full min-h-[42px] px-2.5 py-1.5 rounded-xl border text-sm flex flex-wrap items-center gap-1.5 focus-within:border-amber-500 ${
        isLight
          ? 'bg-white border-slate-300 text-slate-900'
          : 'bg-slate-950 border-slate-800 text-white'
      }`}
    >
      {suggestions.map((s, idx) => {
        const selected = isSelected(s);
        return (
          <button
            key={`${s}-${idx}`}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange(selected ? '' : s)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
              selected
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                : isLight
                ? 'bg-slate-100 text-slate-700 border-slate-300 hover:border-amber-400 hover:text-amber-700'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50 hover:text-amber-300'
            }`}
            title={selected ? `Clear ${s}` : `Select ${s}`}
          >
            {selected && <Check className="w-3 h-3" />}
            {s}
            {selected && (
              <span className="hover:text-white pointer-events-none">
                <X className="w-3 h-3" />
              </span>
            )}
          </button>
        );
      })}

      {value.trim() !== '' && !hasMatchingSuggestion && (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border bg-amber-500 text-slate-950 border-amber-500 shadow-sm`}
        >
          <Check className="w-3 h-3" />
          {value}
          <button
            type="button"
            onClick={() => onChange('')}
            className="hover:text-white cursor-pointer"
            aria-label="Clear tag"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        placeholder={value ? placeholder : 'Select a chip or type one…'}
        className="flex-1 min-w-[120px] bg-transparent focus:outline-none text-sm placeholder:text-slate-500"
      />
    </div>
  );
};
