import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import katex from 'katex';
import { Sigma, X } from 'lucide-react';
import { extractAllEquations } from '../../utils/equationAtCursor';
import { MATH_SNIPPET_CATEGORIES } from './mathSnippets';
import { insertSnippetAtCursor } from '../../utils/cursorInsert';
import { MathText } from '../MathText';

interface CaretPos {
  x: number;
  y: number;
  height: number;
}

function getCaretScreenCoordinates(el: HTMLInputElement | HTMLTextAreaElement): CaretPos {
  const rect = el.getBoundingClientRect();
  const selectionStart = el.selectionStart ?? 0;

  try {
    const isTextArea = el.tagName === 'TEXTAREA';
    const computed = window.getComputedStyle(el);

    let mirror = document.getElementById('katex-caret-mirror') as HTMLDivElement | null;
    if (!mirror) {
      mirror = document.createElement('div');
      mirror.id = 'katex-caret-mirror';
      mirror.style.position = 'absolute';
      mirror.style.top = '-9999px';
      mirror.style.left = '-9999px';
      mirror.style.visibility = 'hidden';
      mirror.style.pointerEvents = 'none';
      mirror.style.whiteSpace = isTextArea ? 'pre-wrap' : 'pre';
      mirror.style.overflowWrap = 'break-word';
      mirror.style.wordBreak = 'break-word';
      document.body.appendChild(mirror);
    }

    const propertiesToCopy = [
      'direction',
      'boxSizing',
      'width',
      'height',
      'overflowX',
      'overflowY',
      'borderTopWidth',
      'borderRightWidth',
      'borderBottomWidth',
      'borderLeftWidth',
      'borderStyle',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'fontStyle',
      'fontVariant',
      'fontWeight',
      'fontStretch',
      'fontSize',
      'fontSizeAdjust',
      'lineHeight',
      'fontFamily',
      'textAlign',
      'textTransform',
      'textIndent',
      'textDecoration',
      'letterSpacing',
      'wordSpacing',
      'tabSize',
    ];

    propertiesToCopy.forEach((prop) => {
      // @ts-ignore
      mirror.style[prop] = computed[prop];
    });

    mirror.style.width = `${rect.width}px`;

    const textUpToCaret = el.value.substring(0, selectionStart);
    mirror.textContent = textUpToCaret;

    const span = document.createElement('span');
    span.textContent = el.value.substring(selectionStart) || '.';
    mirror.appendChild(span);

    const spanRect = span.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();

    const caretX = rect.left + (spanRect.left - mirrorRect.left) - el.scrollLeft;
    const caretY = rect.top + (spanRect.top - mirrorRect.top) - el.scrollTop;
    const lineHeight = parseFloat(computed.lineHeight) || parseFloat(computed.fontSize) || 20;

    return {
      x: Math.max(rect.left, Math.min(rect.right, caretX)),
      y: Math.max(rect.top, Math.min(rect.bottom, caretY)),
      height: lineHeight,
    };
  } catch {
    return {
      x: rect.left + rect.width / 2,
      y: rect.top,
      height: 24,
    };
  }
}

export const KaTeXCursorTooltip: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeEl, setActiveEl] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [caretPos, setCaretPos] = useState<CaretPos | null>(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const cardRef = useRef<HTMLDivElement>(null);

  // Global right-click event listener to trigger the KaTeX toolbar card at cursor
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInput = target.tagName === 'INPUT';
      const isTextArea = target.tagName === 'TEXTAREA';

      if (!isInput && !isTextArea) return;

      const inputEl = target as HTMLInputElement | HTMLTextAreaElement;

      // Ignore non-text inputs
      if (isInput) {
        const type = (inputEl as HTMLInputElement).type?.toLowerCase();
        if (
          [
            'button',
            'checkbox',
            'color',
            'file',
            'hidden',
            'image',
            'radio',
            'range',
            'reset',
            'submit',
          ].includes(type)
        ) {
          return;
        }
      }

      // Prevent default browser context menu
      e.preventDefault();

      inputEl.focus();
      const pos = getCaretScreenCoordinates(inputEl);
      setActiveEl(inputEl);
      setCaretPos(pos);
      setIsOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  // Sync cursor position and handle selection changes while active
  useEffect(() => {
    if (!isOpen || !activeEl) return;

    const updatePos = () => {
      if (document.activeElement !== activeEl) {
        setIsOpen(false);
        return;
      }
      const pos = getCaretScreenCoordinates(activeEl);
      setCaretPos(pos);
    };

    document.addEventListener('selectionchange', updatePos);
    document.addEventListener('input', updatePos);
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);

    return () => {
      document.removeEventListener('selectionchange', updatePos);
      document.removeEventListener('input', updatePos);
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [isOpen, activeEl]);

  // Position card above the cursor
  useEffect(() => {
    if (!isOpen || !caretPos) return;

    const popoverWidth = 384; // w-96
    const popoverHeight = 360;

    let left = caretPos.x - popoverWidth / 2;
    left = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, left));

    let top = caretPos.y - popoverHeight - 12;
    if (top < 12) {
      top = caretPos.y + caretPos.height + 10;
    }

    setTooltipStyle({
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      zIndex: 9999,
    });
  }, [isOpen, caretPos]);

  const handleInsertSnippet = (snippetLatex: string) => {
    if (!activeEl) return;

    const result = insertSnippetAtCursor(activeEl, activeEl.value, snippetLatex);

    const nativeSetter =
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set ||
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;

    if (nativeSetter) {
      nativeSetter.call(activeEl, result.newValue);
    } else {
      activeEl.value = result.newValue;
    }

    activeEl.dispatchEvent(new Event('input', { bubbles: true }));

    activeEl.focus();
    activeEl.setSelectionRange(result.selStart, result.selEnd);
  };

  if (!isOpen || !activeEl || !caretPos) return null;

  const equations = extractAllEquations(activeEl.value);

  return createPortal(
    <div
      ref={cardRef}
      style={tooltipStyle}
      className="pointer-events-auto animate-in fade-in zoom-in-95 duration-100 ease-out"
    >
      <div className="bg-slate-950/95 border border-amber-500/50 shadow-2xl shadow-amber-500/10 backdrop-blur-md rounded-2xl p-3 w-96 max-w-[92vw] text-amber-200 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 select-none">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Sigma className="w-4 h-4 text-amber-400 shrink-0" />
            <span>KaTeX Math Toolbar</span>
          </div>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsOpen(false)}
            className="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Close Toolbar (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Preview (Equations Only) */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-400 select-none">
            Live Preview (Equations Only)
          </div>
          <div className="min-h-[2.75rem] max-h-32 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm overflow-y-auto">
            {equations.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {equations.map((eq, idx) => (
                  <div key={idx} className="py-0.5 border-b border-slate-800/50 last:border-0">
                    <MathText text={eq.isBlock ? `$$${eq.rawMath}$$` : `$${eq.rawMath}$`} />
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-slate-600">
                {activeEl.value && activeEl.value.trim() ? 'No equations found in text' : 'Nothing typed yet'}
              </span>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {MATH_SNIPPET_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.name}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setActiveCategory(idx)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                activeCategory === idx
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Snippet Grid */}
        <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
          {MATH_SNIPPET_CATEGORIES[activeCategory].snippets.map((snip) => (
            <button
              key={snip.label}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleInsertSnippet(snip.latex)}
              title={snip.latex}
              className="px-2 py-1.5 rounded-lg text-[11px] font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-300 text-left truncate transition-all cursor-pointer"
            >
              {snip.label}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};
