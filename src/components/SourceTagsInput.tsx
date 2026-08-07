import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface SourceTagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  isAppLight: boolean;
  inputClassName?: string;
  chipClassName?: string;
}

/**
 * Multi-tag input for source tags. Type a tag and press Enter (or comma)
 * to add it; each tag renders as a removable chip.
 */
export const SourceTagsInput: React.FC<SourceTagsInputProps> = ({
  value,
  onChange,
  placeholder = 'e.g. ঢাকা বোর্ড ২০২৪',
  isAppLight,
  inputClassName,
  chipClassName,
}) => {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const tag = draft.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${
                chipClassName ||
                (isAppLight
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
              }`}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="cursor-pointer hover:opacity-70 transition-opacity"
                aria-label={`Remove source tag ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={placeholder}
          className={
            inputClassName ||
            `w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-amber-500 ${
              isAppLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
            }`
          }
        />
        <button
          type="button"
          onClick={addTag}
          className={`shrink-0 p-2 rounded-xl border cursor-pointer transition-colors ${
            isAppLight
              ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
          title="Add source tag"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
