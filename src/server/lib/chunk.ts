const BANGLA_CHAR_RE = /[\u0980-\u09FF]/g;

export function estimateTokens(text: string): number {
  const banglaChars = (text.match(BANGLA_CHAR_RE) || []).length;
  const otherChars = text.length - banglaChars;
  // Bangla tokenizes roughly 1 token per ~2 chars; ASCII ~4 chars/token.
  return Math.ceil(banglaChars / 2 + otherChars / 4);
}

export interface Chunk {
  index: number;
  text: string;
  approxTokens: number;
}

export const DEFAULT_CHUNK_TOKENS = 4000;

export function chunkText(text: string, targetTokens = DEFAULT_CHUNK_TOKENS): Chunk[] {
  const lines = text.split('\n');
  const chunks: Chunk[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  const flush = () => {
    const joined = current.join('\n').trim();
    if (joined) {
      chunks.push({ index: chunks.length, text: joined, approxTokens: estimateTokens(joined) });
    }
    current = [];
    currentTokens = 0;
  };

  for (const line of lines) {
    const lineTokens = estimateTokens(line);
    if (currentTokens + lineTokens > targetTokens && current.length > 0) {
      flush();
    }
    current.push(line);
    currentTokens += lineTokens;
  }
  flush();

  return chunks;
}
