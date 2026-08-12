import React, { useEffect, useRef, useState } from 'react';
import { Sigma } from 'lucide-react';
import { MathText } from '../MathText';
import { MATH_SNIPPET_CATEGORIES } from './mathSnippets';
import { insertSnippetAtCursor } from '../../utils/cursorInsert';

interface MathHelperButtonProps {
  value: string;
  onChange: (newValue: string) => void;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  isAppLight: boolean;
  label?: string;
  className?: string;
}

// Floating "fx" helper: shows a live-rendered KaTeX preview of the field's
// current LaTeX (so the raw code can stay hidden) plus a clickable palette
// of SSC/HSC math/physics/chemistry snippets that insert at the cursor.
export const MathHelperButton: React.FC<MathHelperButtonProps> = ({
  value,
  onChange,
  inputRef,
  isAppLight,
  label = 'equation',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const popoverWidth = 384; // w-96
    const margin = 8;
    let left = rect.right - popoverWidth;
    left = Math.max(margin, Math.min(left, window.innerWidth - popoverWidth - margin));
    let top = rect.bottom + margin;
    const estimatedHeight = 420;
    if (top + estimatedHeight > window.innerHeight) {
      top = Math.max(margin, rect.top - estimatedHeight - margin);
    }
    setPopoverPos({ top, left });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Restore focus + cursor position on the field after a snippet insertion
  // (has to happen after React re-renders the field with the new value).
  useEffect(() => {
    if (!pendingSelection.current) return;
    const { start, end } = pendingSelection.current;
    pendingSelection.current = null;
    const el = inputRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(start, end);
    }
  }, [value, inputRef]);

  const handleInsert = (snippet: string) => {
    const result = insertSnippetAtCursor(inputRef.current, value, snippet);
    pendingSelection.current = { start: result.selStart, end: result.selEnd };
    onChange(result.newValue);
  };

  const panelCls = isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty';

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        title={`Math helper for ${label} — insert & preview LaTeX`}
        className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
          isOpen
            ? 'bg-amber-500 border-amber-500 text-slate-950'
            : isAppLight
            ? 'bg-slate-100 border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300'
            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-500/50'
        } ${className}`}
      >
        <Sigma className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          style={{ position: 'fixed', top: popoverPos.top, left: popoverPos.left, zIndex: 100 }}
          className={`${panelCls} w-96 max-w-[92vw] rounded-2xl border p-3 space-y-3 shadow-2xl ${
            isAppLight ? 'border-slate-200' : 'border-slate-800'
          }`}
        >
          {/* Live preview */}
          <div>
            <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Live Preview
            </div>
            <div
              className={`min-h-[2.75rem] rounded-xl border px-3 py-2 text-sm overflow-x-auto ${
                isAppLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            >
              {value && value.trim() ? (
                <MathText text={value} />
              ) : (
                <span className={isAppLight ? 'text-slate-400' : 'text-slate-600'}>Nothing typed yet</span>
              )}
            </div>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5">
            {MATH_SNIPPET_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveCategory(idx)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  activeCategory === idx
                    ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                    : isAppLight
                    ? 'bg-slate-100 border-slate-200 text-slate-600'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Snippet grid */}
          <div className="grid grid-cols-3 gap-1.5 max-h-56 overflow-y-auto pr-1">
            {MATH_SNIPPET_CATEGORIES[activeCategory].snippets.map((snip) => (
              <button
                key={snip.label}
                type="button"
                onClick={() => handleInsert(snip.latex)}
                title={snip.latex}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border text-left truncate transition-all cursor-pointer ${
                  isAppLight
                    ? 'bg-white border-slate-200 text-slate-700 hover:border-amber-400 hover:bg-amber-50'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500/50 hover:bg-amber-500/10'
                }`}
              >
                {snip.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
