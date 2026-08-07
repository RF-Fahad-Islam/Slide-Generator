import { useCallback, useState } from 'react';
import { MCQItem } from '../types';
import {
  TagMemory,
  RememberTagInput,
  loadTagMemory,
  rememberTagValues,
  rememberTagsFromItems,
} from '../utils/tagMemory';

/**
 * Reactive view over the tag memory store. Re-renders suggestion lists whenever a
 * value is remembered, so chip pickers update live.
 */
export function useTagMemory() {
  const [memory, setMemory] = useState<TagMemory>(() => loadTagMemory());

  const remember = useCallback((input: RememberTagInput): TagMemory => {
    const next = rememberTagValues(input);
    setMemory(next);
    return next;
  }, []);

  const rememberItems = useCallback((items: MCQItem[]): TagMemory => {
    const next = rememberTagsFromItems(items);
    setMemory(next);
    return next;
  }, []);

  return { memory, remember, rememberItems };
}
