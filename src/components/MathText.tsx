import React from 'react';
import katex from 'katex';
import { formatMathAndChemistry } from '../utils/latexFormatter';

interface MathTextProps {
  text: string;
  className?: string;
  inline?: boolean;
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  if (text === null || text === undefined) return null;
  const strText = String(text);
  if (!strText.trim()) return null;

  // Auto-format un-delimited chemical formulas, units, & LaTeX macros
  const processedText = formatMathAndChemistry(strText);

  // Split text into normal text parts and math parts ($$ ... $$ and $ ... $)
  // Handles multiline math expressions (e.g. matrices, determinants, cases)
  const regex = /(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g;
  const parts = processedText.split(regex);

  return (
    <span className={`inline-wrap ${className}`}>
      {parts.map((part, index) => {
        if (!part) return null;

        const isBlock = part.startsWith('$$') && part.endsWith('$$');
        const isInline = part.startsWith('$') && part.endsWith('$') && !isBlock;

        if (isBlock || isInline) {
          const rawMath = isBlock ? part.slice(2, -2) : part.slice(1, -1);
          try {
            const html = katex.renderToString(rawMath.trim(), {
              displayMode: isBlock,
              throwOnError: false,
              output: 'html', // Output HTML only (no duplicate MathML text)
            });

            return (
              <span
                key={index}
                className={isBlock ? 'my-2 block text-center' : 'inline-flex items-center align-middle whitespace-nowrap mx-1 max-w-full overflow-x-visible'}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return (
              <span key={index} className="font-mono text-amber-400 bg-slate-900/50 px-1 rounded">
                {part}
              </span>
            );
          }
        }

        // Handle linebreaks in plain text
        return (
          <React.Fragment key={index}>
            {part.split('\n').map((line, lIdx, arr) => (
              <React.Fragment key={lIdx}>
                {line}
                {lIdx < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </React.Fragment>
        );
      })}
    </span>
  );
};
