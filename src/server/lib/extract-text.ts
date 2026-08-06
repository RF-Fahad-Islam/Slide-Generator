import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

export interface ExtractedDocument {
  kind: 'text' | 'vision';
  text: string;
  pages: { num: number; text: string }[];
  warnings: string[];
}

const BANGLA_RE = /[\u0980-\u09FF]/g;

export function banglaRatio(text: string): number {
  const nonSpace = text.replace(/\s+/g, '');
  if (nonSpace.length === 0) return 0;
  const banglaChars = (text.match(BANGLA_RE) || []).length;
  return banglaChars / nonSpace.length;
}

export function hasCleanBanglaText(text: string): boolean {
  const nonSpace = text.replace(/\s+/g, '').length;
  return nonSpace >= 100 && banglaRatio(text) >= 0.3;
}

function mimeToKind(mimeType: string | undefined, filename?: string): 'pdf' | 'docx' | 'text' | 'image' | 'doc' | 'unknown' {
  const mt = (mimeType || '').toLowerCase();
  const ext = (filename || '').split('.').pop()?.toLowerCase() || '';
  if (mt === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (
    mt === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    return 'docx';
  }
  if (mt === 'application/msword' || ext === 'doc') return 'doc';
  if (mt.startsWith('text/') || ['txt', 'md', 'csv'].includes(ext)) return 'text';
  if (mt.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return 'image';
  return 'unknown';
}

export async function extractPdfText(buffer: Buffer): Promise<ExtractedDocument['pages']> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.pages.map((p) => ({ num: p.num, text: p.text || '' }));
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

export async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || '';
}

export function normalizeMime(mimeType: string | undefined, filename?: string): string {
  const kind = mimeToKind(mimeType, filename);
  switch (kind) {
    case 'pdf':
      return 'application/pdf';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'doc':
      return 'application/msword';
    case 'image':
      return mimeType || 'image/png';
    case 'text':
    default:
      return 'text/plain';
  }
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType?: string,
  filename?: string,
): Promise<ExtractedDocument> {
  const kind = mimeToKind(mimeType, filename);

  if (kind === 'doc') {
    throw new Error(
      'Legacy .doc files are not supported. Save the document as .docx (or a PDF/image) and upload again.',
    );
  }

  if (kind === 'pdf') {
    const pages = await extractPdfText(buffer);
    const text = pages.map((p) => p.text).join('\n\n').trim();

    // Clean Unicode Bangla text layer → fast local path (no OCR needed).
    if (hasCleanBanglaText(text)) {
      return { kind: 'text', text, pages, warnings: [] };
    }

    // Scanned or legacy-encoded (Bijoy) text layer → must go through vision OCR.
    const warnings: string[] = [];
    if (text.trim().length === 0) {
      warnings.push('Scanned PDF detected — no text layer found. Using vision OCR for high-accuracy Bangla extraction.');
    } else {
      warnings.push('PDF text layer is not clean Unicode Bangla (likely scanned or legacy-encoded). Using vision OCR for accuracy.');
    }
    return { kind: 'vision', text: '', pages, warnings };
  }

  if (kind === 'docx') {
    const text = await extractDocxText(buffer);
    const warnings: string[] = [];
    if (text.trim().length === 0) {
      warnings.push('DOCX contained no extractable text — it may be image-based.');
    }
    return { kind: 'text', text, pages: [{ num: 1, text }], warnings };
  }

  if (kind === 'text') {
    const text = buffer.toString('utf-8').trim();
    return { kind: 'text', text, pages: [{ num: 1, text }], warnings: [] };
  }

  if (kind === 'image') {
    return {
      kind: 'vision',
      text: '',
      pages: [],
      warnings: ['Image document detected — using vision OCR for high-accuracy Bangla extraction.'],
    };
  }

  return {
    kind: 'vision',
    text: '',
    pages: [],
    warnings: ['Unknown document type — using vision OCR.'],
  };
}
