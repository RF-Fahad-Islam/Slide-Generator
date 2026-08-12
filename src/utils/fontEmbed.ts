// Deterministic font embedding for html-to-image exports.
//
// html-to-image auto-collects @font-face rules by scanning the document's
// stylesheets (getWebFontCSS) and fetching each font's src URL. That path
// silently breaks on cross-origin stylesheets, @import chains, and fonts whose
// fetch fails mid-capture — which is why exported PNG/PDF/ZIP images fell back
// to system fonts. Passing an explicit `fontEmbedCSS` (every self-hosted face
// as a base64 data URI) skips the stylesheet scan entirely and makes each
// export embed exactly the fonts the preview uses, on or offline.

interface FontFaceSpec {
  family: string;
  style: string;
  weight: string;
  file: string;
  format: string;
}

// Mirrors the @font-face declarations in src/fonts.css. Keep the two in sync.
const FONT_FACE_SPECS: FontFaceSpec[] = [
  { family: 'Kalpurush', style: 'normal', weight: '400 900', file: '/fonts/kalpurush.woff2', format: 'woff2' },
  { family: 'Hind Siliguri', style: 'normal', weight: '400', file: '/fonts/HindSiliguri-Regular.ttf', format: 'truetype' },
  { family: 'Hind Siliguri', style: 'normal', weight: '700', file: '/fonts/HindSiliguri-Bold.ttf', format: 'truetype' },
  { family: 'Noto Sans Bengali', style: 'normal', weight: '400 700', file: '/fonts/NotoSansBengali-Regular.woff2', format: 'woff2' },
  { family: 'Anek Bangla', style: 'normal', weight: '400 800', file: '/fonts/AnekBangla-Regular.ttf', format: 'truetype' },
  { family: 'Tiro Bangla', style: 'normal', weight: '400', file: '/fonts/TiroBangla-Regular.ttf', format: 'truetype' },
  { family: 'Atma', style: 'normal', weight: '500 700', file: '/fonts/Atma-Regular.ttf', format: 'truetype' },
  { family: 'Mina', style: 'normal', weight: '400 700', file: '/fonts/Mina-Regular.ttf', format: 'truetype' },
  { family: 'Plus Jakarta Sans', style: 'normal', weight: '400 800', file: '/fonts/PlusJakartaSans-Regular.ttf', format: 'truetype' },
  { family: 'Poppins', style: 'normal', weight: '400', file: '/fonts/Poppins-Regular.ttf', format: 'truetype' },
  { family: 'Poppins', style: 'normal', weight: '700', file: '/fonts/Poppins-Bold.ttf', format: 'truetype' },
  { family: 'Playfair Display', style: 'normal', weight: '400 800', file: '/fonts/PlayfairDisplay-Regular.ttf', format: 'truetype' },
  { family: 'Fira Code', style: 'normal', weight: '400', file: '/fonts/FiraCode-Regular.ttf', format: 'truetype' },
  { family: 'Fira Code', style: 'normal', weight: '700', file: '/fonts/FiraCode-Regular.ttf', format: 'truetype' },
];

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return btoa(binary);
};

let fontEmbedCssPromise: Promise<string> | null = null;

// Builds a single CSS string declaring every self-hosted font face as a base64
// data URI. Memoized — the browser caches the font fetches, so the first export
// pays the cost and every later export is instant.
export const getFontEmbedCSS = (): Promise<string> => {
  if (!fontEmbedCssPromise) {
    fontEmbedCssPromise = (async () => {
      const faces = await Promise.all(
        FONT_FACE_SPECS.map(async (spec) => {
          try {
            const res = await fetch(spec.file, { cache: 'force-cache' });
            if (!res.ok) return '';
            const mime = spec.format === 'woff2' ? 'font/woff2' : 'font/ttf';
            const b64 = arrayBufferToBase64(await res.arrayBuffer());
            return `@font-face{font-family:'${spec.family}';font-style:${spec.style};font-weight:${spec.weight};src:url(data:${mime};base64,${b64}) format('${spec.format}');}`;
          } catch {
            return '';
          }
        })
      );
      return faces.join('');
    })().catch(() => '');
  }
  return fontEmbedCssPromise;
};
