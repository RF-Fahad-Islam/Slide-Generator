import React from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
  inline?: boolean;
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '', inline = true }) => {
  if (text === null || text === undefined) return null;
  const strText = String(text);
  if (!strText) return null;

  // Split text into normal text parts and math parts
  // Regex matches $$...$$ for block math and $...$ for inline math
  const regex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g;
  const parts = strText.split(regex);

  return (
    <span className={`inline-wrap ${className}`}>
      {parts.map((part, index) => {
        if (!part) return null;

        const isBlock = part.startsWith('$$') && part.endsWith('$$');
        const isInline = part.startsWith('$') && part.endsWith('$') && !isBlock;

        if (isBlock || isInline) {
          const rawMath = isBlock ? part.slice(2, -2) : part.slice(1, -1);
          try {
            const html = katex.renderToString(rawMath, {
              displayMode: isBlock,
              throwOnError: false,
              output: 'htmlAndMathml',
            });

            return (
              <span
                key={index}
                className={isBlock ? 'my-2 block text-center' : 'inline-block mx-0.5'}
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
