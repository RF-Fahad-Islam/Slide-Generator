import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import katex from 'katex';
import { Sigma } from 'lucide-react';
import { getEquationAtCursor, EquationAtCursor } from '../../utils/equationAtCursor';

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

    // Reuse or create hidden mirror element
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

  useEffect(() => {
    const updateTooltip = () => {
      const activeEl = document.activeElement;
      if (
        !activeEl ||
        (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA')
      ) {
        setEquation(null);
        setCaretPos(null);
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

    // Approximate width and height of tooltip
    const estimatedWidth = Math.min(320, window.innerWidth - 32);
    const estimatedHeight = equation.isBlock ? 80 : 54;

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
  }, [equation, caretPos]);

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
      className="pointer-events-none animate-in fade-in zoom-in-95 duration-100 ease-out"
    >
      <div className="bg-slate-950/95 border border-amber-500/50 shadow-2xl shadow-amber-500/10 backdrop-blur-md rounded-xl p-2.5 max-w-[90vw] w-max min-w-[140px] text-amber-200">
        <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold tracking-wider text-amber-400 uppercase border-b border-amber-500/20 pb-1 select-none">
          <Sigma className="w-3 h-3 text-amber-400 shrink-0" />
          <span>KaTeX Equation Preview</span>
        </div>
        <div className="min-h-[1.5rem] flex items-center justify-center overflow-x-auto px-1 py-0.5 text-sm">
          {!renderError ? (
            <span dangerouslySetInnerHTML={{ __html: katexHtml }} />
          ) : (
            <span className="font-mono text-amber-400 text-xs">{equation.rawMath}</span>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
