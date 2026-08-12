import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import katex from 'katex';
import { Sigma, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { getEquationAtCursor, EquationAtCursor } from '../../utils/equationAtCursor';
import { MATH_SNIPPET_CATEGORIES } from './mathSnippets';
import { insertSnippetAtCursor } from '../../utils/cursorInsert';

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
  const [equation, setEquation] = useState<EquationAtCursor | null>(null);
  const [caretPos, setCaretPos] = useState<CaretPos | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [showToolbar, setShowToolbar] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  const lastActiveInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const updateTooltip = () => {
      const activeEl = document.activeElement;
      if (
        !activeEl ||
        (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA')
      ) {
        // Keep equation if user is clicking inside the toolbar, otherwise hide
        const isClickingInsideTooltip = document.querySelector('.katex-cursor-tooltip-container')?.contains(activeEl);
        if (!isClickingInsideTooltip && !lastActiveInputRef.current) {
          setEquation(null);
          setCaretPos(null);
        }
        return;
      }

      const inputEl = activeEl as HTMLInputElement | HTMLTextAreaElement;

      // Ignore non-text inputs
      if (activeEl.tagName === 'INPUT') {
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
          setEquation(null);
          setCaretPos(null);
          return;
        }
      }

      lastActiveInputRef.current = inputEl;

      const val = inputEl.value;
      const selStart = inputEl.selectionStart ?? 0;

      const foundEq = getEquationAtCursor(val, selStart);

      if (!foundEq) {
        setEquation(null);
        setCaretPos(null);
        return;
      }

      const pos = getCaretScreenCoordinates(inputEl);
      setEquation(foundEq);
      setCaretPos(pos);
    };

    const handleEvents = () => {
      requestAnimationFrame(updateTooltip);
    };

    document.addEventListener('selectionchange', handleEvents);
    document.addEventListener('focusin', handleEvents);
    document.addEventListener('focusout', handleEvents);
    document.addEventListener('input', handleEvents);
    document.addEventListener('keyup', handleEvents);
    document.addEventListener('click', handleEvents);
    window.addEventListener('scroll', handleEvents, true);
    window.addEventListener('resize', handleEvents);

    return () => {
      document.removeEventListener('selectionchange', handleEvents);
      document.removeEventListener('focusin', handleEvents);
      document.removeEventListener('focusout', handleEvents);
      document.removeEventListener('input', handleEvents);
      document.removeEventListener('keyup', handleEvents);
      document.removeEventListener('click', handleEvents);
      window.removeEventListener('scroll', handleEvents, true);
      window.removeEventListener('resize', handleEvents);
    };
  }, []);

  useEffect(() => {
    if (!equation || !caretPos) return;

    const estimatedWidth = showToolbar ? Math.min(384, window.innerWidth - 32) : Math.min(320, window.innerWidth - 32);
    const estimatedHeight = showToolbar ? 320 : (equation.isBlock ? 80 : 54);

    let left = caretPos.x - estimatedWidth / 2;
    left = Math.max(16, Math.min(window.innerWidth - estimatedWidth - 16, left));

    let top = caretPos.y - estimatedHeight - 12;
    if (top < 12) {
      top = caretPos.y + caretPos.height + 10;
    }

    setTooltipStyle({
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      zIndex: 9999,
    });
  }, [equation, caretPos, showToolbar]);

  const handleInsertSnippet = (snippetLatex: string) => {
    const activeEl = document.activeElement;
    const targetEl = (
      activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')
        ? activeEl
        : lastActiveInputRef.current
    ) as HTMLInputElement | HTMLTextAreaElement | null;

    if (!targetEl) return;

    const result = insertSnippetAtCursor(targetEl, targetEl.value, snippetLatex);

    const isTextArea = targetEl.tagName === 'TEXTAREA';
    const proto = isTextArea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const valueSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

    if (valueSetter) {
      valueSetter.call(targetEl, result.newValue);
    } else {
      targetEl.value = result.newValue;
    }

    // Reset React 16+ value tracker
    // @ts-ignore
    const tracker = targetEl._valueTracker;
    if (tracker) {
      tracker.setValue('');
    }

    targetEl.dispatchEvent(new Event('input', { bubbles: true }));
    targetEl.dispatchEvent(new Event('change', { bubbles: true }));

    targetEl.focus();
    targetEl.setSelectionRange(result.selStart, result.selEnd);
  };

  if (!equation || !caretPos) return null;

  let katexHtml = '';
  let renderError = false;
  try {
    katexHtml = katex.renderToString(equation.rawMath, {
      displayMode: equation.isBlock,
      throwOnError: false,
      output: 'html',
    });
  } catch {
    renderError = true;
  }

  return createPortal(
    <div
      style={tooltipStyle}
      className="katex-cursor-tooltip-container pointer-events-auto animate-in fade-in zoom-in-95 duration-100 ease-out"
    >
      <div className="bg-slate-950/95 border border-amber-500/50 shadow-2xl shadow-amber-500/10 backdrop-blur-md rounded-xl p-3 max-w-[92vw] w-max min-w-[240px] text-amber-200 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 text-[10px] font-bold tracking-wider text-amber-400 uppercase border-b border-amber-500/20 pb-1.5 select-none">
          <div className="flex items-center gap-1.5">
            <Sigma className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>KaTeX Equation Preview</span>
          </div>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowToolbar((v) => !v)}
            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 transition-all flex items-center gap-1 cursor-pointer"
            title="Open Math Snippets Toolbar at Cursor"
          >
            <Sparkles className="w-3 h-3" />
            <span>{showToolbar ? 'Hide Toolbar' : 'Math Toolbar'}</span>
            {showToolbar ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Equation Preview */}
        <div className="min-h-[1.5rem] max-h-24 flex items-center justify-center overflow-x-auto px-1 py-0.5 text-sm">
          {!renderError ? (
            <span dangerouslySetInnerHTML={{ __html: katexHtml }} />
          ) : (
            <span className="font-mono text-amber-400 text-xs">{equation.rawMath}</span>
          )}
        </div>

        {/* Inline Math Toolbar */}
        {showToolbar && (
          <div className="pt-2 border-t border-slate-800 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Categories */}
            <div className="flex flex-wrap gap-1">
              {MATH_SNIPPET_CATEGORIES.map((cat, idx) => (
                <button
                  key={cat.name}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setActiveCategory(idx)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                    activeCategory === idx
                      ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Snippet Grid */}
            <div className="grid grid-cols-3 gap-1 max-h-44 overflow-y-auto pr-0.5">
              {MATH_SNIPPET_CATEGORIES[activeCategory].snippets.map((snip) => (
                <button
                  key={snip.label}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleInsertSnippet(snip.latex)}
                  title={snip.latex}
                  className="px-1.5 py-1 rounded text-[11px] font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-300 text-left truncate transition-all cursor-pointer"
                >
                  {snip.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
