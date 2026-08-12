// PPTX font embedding — PowerPoint's "Embed fonts in the file" behavior.
//
// pptxgenjs has no font-embedding API, so after the presentation is generated
// as a Blob we post-process the OOXML package with JSZip:
//   - add the actual TTF binaries under ppt/fonts/fntdataN.ttf
//   - write ppt/fontTable.xml declaring each family with <p:embedRegular/> /
//     <p:embedBold/> + relationships to the binaries
//   - wire it up in ppt/_rels/fontTable.xml.rels, ppt/_rels/presentation.xml.rels,
//     ppt/presentation.xml (<p:embeddedFontLst/>) and [Content_Types].xml
//
// PowerPoint then renders every run with the embedded font even on machines
// that don't have the font installed, so the editable PPTX looks exactly like
// the exported image. Only the fonts the deck actually uses are embedded
// (keeps the file small).
import JSZip from 'jszip';
import { DeckConfig, MCQItem, SlideTextBox } from '../types';
import { resolveTheme } from './themeResolver';
import { getBoxFontFamily } from './slideTextBoxes';

// Map a font-family name to its embeddable TTF(s). PowerPoint embedded fonts
// must be TrueType binaries (woff2 is NOT supported), so each family points at
// the self-hosted .ttf we ship in public/fonts. `bold` is embedded only when a
// distinct bold face exists (Hind Siliguri, Poppins); otherwise PowerPoint
// synthesizes bold from the regular face.
const FONT_FILES: Record<string, { regular: string; bold?: string }> = {
  'Kalpurush': { regular: '/fonts/Kalpurush.ttf' },
  'Hind Siliguri': { regular: '/fonts/HindSiliguri-Regular.ttf', bold: '/fonts/HindSiliguri-Bold.ttf' },
  'Noto Sans Bengali': { regular: '/fonts/NotoSansBengali-Regular.ttf' },
  'Anek Bangla': { regular: '/fonts/AnekBangla-Regular.ttf' },
  'Tiro Bangla': { regular: '/fonts/TiroBangla-Regular.ttf' },
  'Atma': { regular: '/fonts/Atma-Regular.ttf' },
  'Mina': { regular: '/fonts/Mina-Regular.ttf' },
  'Plus Jakarta Sans': { regular: '/fonts/PlusJakartaSans-Regular.ttf' },
  'Poppins': { regular: '/fonts/Poppins-Regular.ttf', bold: '/fonts/Poppins-Bold.ttf' },
  'Playfair Display': { regular: '/fonts/PlayfairDisplay-Regular.ttf' },
  'Fira Code': { regular: '/fonts/FiraCode-Regular.ttf' },
};

const familyNameOf = (css: string): string => css.replace(/'/g, '').split(',')[0].trim();

// The exact font families the deck will reference when exported — deck-level
// role fonts (header/body/options/footer + default, with theme defaults) and
// every text box's resolved font (per-box override -> role font -> default),
// across the deck and per-slide customConfig overrides.
export const getUsedFontFamilies = (config: DeckConfig, items: MCQItem[]): string[] => {
  const set = new Set<string>();
  const add = (css: string | undefined) => {
    if (!css) return;
    const name = familyNameOf(css);
    if (FONT_FILES[name]) set.add(name);
  };
  const scanBoxes = (boxes: SlideTextBox[] | undefined, effConfig: DeckConfig) => {
    (boxes || []).forEach(b => add(getBoxFontFamily(b, effConfig)));
  };

  const theme = resolveTheme(config);
  add(theme.fonts.defaultFont);
  add(theme.fonts.headerFont);
  add(theme.fonts.bodyFont);
  add(theme.fonts.optionsFont);
  add(theme.fonts.footerFont);
  scanBoxes(config.slideTextBoxes, config);

  items.forEach(item => {
    const effConfig: DeckConfig = item.customConfig ? { ...config, ...item.customConfig } : config;
    const itemTheme = resolveTheme(effConfig);
    add(itemTheme.fonts.defaultFont);
    add(itemTheme.fonts.headerFont);
    add(itemTheme.fonts.bodyFont);
    add(itemTheme.fonts.optionsFont);
    add(itemTheme.fonts.footerFont);
    scanBoxes(effConfig.slideTextBoxes, effConfig);
  });

  return [...set];
};

interface EmbeddedFontEntry {
  family: string;
  kind: 'regular' | 'bold';
  rId: string;
  fileName: string;
}

// Post-processes a generated .pptx (Blob or binary) embedding the given font
// families. Families with no fetchable TTF are silently skipped. Returns the
// original data unchanged (as a Blob) when nothing could be embedded.
export const embedFontsInPptx = async (
  data: Blob | ArrayBuffer | Uint8Array,
  families: string[]
): Promise<Blob> => {
  const zip = await JSZip.loadAsync(data);
  const entries: EmbeddedFontEntry[] = [];
  let rIdCounter = 1;

  for (const family of families) {
    const spec = FONT_FILES[family];
    if (!spec) continue;
    const faces: { kind: 'regular' | 'bold'; file: string }[] = [{ kind: 'regular', file: spec.regular }];
    if (spec.bold) faces.push({ kind: 'bold', file: spec.bold });
    for (const face of faces) {
      try {
        const res = await fetch(face.file, { cache: 'force-cache' });
        if (!res.ok) continue;
        const buffer = await res.arrayBuffer();
        const fileName = `fntdata${rIdCounter}.ttf`;
        zip.file(`ppt/fonts/${fileName}`, buffer);
        entries.push({ family, kind: face.kind, rId: `rId${rIdCounter}`, fileName });
        rIdCounter++;
      } catch {
        // Font fetch failed (offline first run) — skip this face gracefully.
      }
    }
  }

  if (entries.length === 0) {
    return data instanceof Blob ? data : new Blob([data]);
  }

  // Group entries per family for fontTable.xml (one <p:font> per family).
  const groups: { family: string; entries: EmbeddedFontEntry[] }[] = [];
  entries.forEach(entry => {
    const group = groups.find(g => g.family === entry.family);
    if (group) group.entries.push(entry);
    else groups.push({ family: entry.family, entries: [entry] });
  });

  const fontTableXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<p:fontTable xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
    'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">' +
    groups.map(g =>
      `<p:font typeface="${g.family}" pitchFamily="34" charset="0">` +
      g.entries.map(e =>
        e.kind === 'bold'
          ? `<p:embedBold r:id="${e.rId}"/>`
          : `<p:embedRegular r:id="${e.rId}"/>`
      ).join('') +
      `</p:font>`
    ).join('') +
    '</p:fontTable>';
  zip.file('ppt/fontTable.xml', fontTableXml);

  zip.file(
    'ppt/_rels/fontTable.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      entries.map(e =>
        `<Relationship Id="${e.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" Target="../fonts/${e.fileName}"/>`
      ).join('') +
      '</Relationships>'
  );

  // presentation.xml.rels — point the presentation at the fontTable part.
  const presRelsPath = 'ppt/_rels/presentation.xml.rels';
  const presRels = await zip.file(presRelsPath)?.async('string');
  if (presRels) {
    const fontTableRid = 'rIdFontTable';
    zip.file(
      presRelsPath,
      presRels.replace(
        '</Relationships>',
        `<Relationship Id="${fontTableRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/></Relationships>`
      )
    );

    // presentation.xml — <p:embeddedFontLst/> must appear after <p:notesSz/>
    // and before <p:defaultTextStyle/> (schema order).
    const presPath = 'ppt/presentation.xml';
    const presXml = await zip.file(presPath)?.async('string');
    if (presXml) {
      const marker = '</p:notesSz>';
      const embeddedLst = `<p:embeddedFontLst r:id="${fontTableRid}"/>`;
      const updated = presXml.includes(marker)
        ? presXml.replace(marker, marker + embeddedLst)
        : presXml.replace('</p:presentation>', embeddedLst + '</p:presentation>');
      zip.file(presPath, updated);
    }
  }

  // [Content_Types].xml — declare the ttf extension + fontTable override.
  const ctPath = '[Content_Types].xml';
  const ctXml = await zip.file(ctPath)?.async('string');
  if (ctXml) {
    let updated = ctXml;
    if (!updated.includes('Extension="ttf"')) {
      updated = updated.replace('</Types>', '<Default Extension="ttf" ContentType="application/x-font-ttf"/></Types>');
    }
    if (!updated.includes('fontTable.xml')) {
      updated = updated.replace('</Types>', '<Override PartName="/ppt/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.fontTable+xml"/></Types>');
    }
    zip.file(ctPath, updated);
  }

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
};
