import React from 'react';
import { getSourceTags, MCQItem } from '../types';

interface SourceTagChipsProps {
  item: Pick<MCQItem, 'source'>;
  className?: string;
  chipClassName?: string;
  renderChip?: (tag: string) => React.ReactNode;
}

/**
 * Renders an MCQ's source tags as one or more chips.
 * Legacy decks with a single string `source` render as a single chip too.
 */
export const SourceTagChips: React.FC<SourceTagChipsProps> = ({
  item,
  className = 'flex flex-wrap items-center gap-2',
  chipClassName = '',
  renderChip,
}) => {
  const tags = getSourceTags(item);
  if (tags.length === 0) return null;

  return (
    <div className={className}>
      {tags.map((tag) => (
        <React.Fragment key={tag}>
          {renderChip ? renderChip(tag) : (
            <span className={chipClassName}>{tag}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
