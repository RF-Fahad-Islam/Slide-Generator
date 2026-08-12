import { toPng } from 'html-to-image';

export type CleanExportOptions = Parameters<typeof toPng>[1];

/**
 * Safely converts an HTML element to a PNG Data URL using html-to-image,
 * temporarily stripping CSS `backdrop-filter` to prevent WebKit/Chromium
 * SVG <foreignObject> canvas rasterization corruptions (dark smudges / black pixel boxes).
 */
export const safeToPng = async (
  el: HTMLElement,
  options?: CleanExportOptions
): Promise<string> => {
  el.setAttribute('data-exporting', 'true');
  el.classList.add('to-png-export');
  try {
    const dataUrl = await toPng(el, {
      pixelRatio: 1.5,
      cacheBust: false,
      ...options,
    });
    return dataUrl;
  } finally {
    el.removeAttribute('data-exporting');
    el.classList.remove('to-png-export');
  }
};
