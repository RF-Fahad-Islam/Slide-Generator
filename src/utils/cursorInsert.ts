// Splices a LaTeX snippet into a text field's value at the current cursor
// position, and works out where the cursor should land afterwards — inside
// the first empty `{}` placeholder in the inserted snippet if there is one,
// otherwise right after the snippet.

export interface CursorInsertResult {
  newValue: string;
  selStart: number;
  selEnd: number;
}

export function insertSnippetAtCursor(
  el: HTMLInputElement | HTMLTextAreaElement | null,
  currentValue: string,
  snippet: string
): CursorInsertResult {
  const value = currentValue ?? '';
  const hasSelection =
    el && typeof el.selectionStart === 'number' && typeof el.selectionEnd === 'number';
  const start = hasSelection ? (el!.selectionStart as number) : value.length;
  const end = hasSelection ? (el!.selectionEnd as number) : value.length;

  const newValue = value.slice(0, start) + snippet + value.slice(end);

  const placeholderOffset = snippet.indexOf('{}');
  if (placeholderOffset !== -1) {
    const cursorPos = start + placeholderOffset + 1; // land between { and }
    return { newValue, selStart: cursorPos, selEnd: cursorPos };
  }

  const cursorPos = start + snippet.length;
  return { newValue, selStart: cursorPos, selEnd: cursorPos };
}
