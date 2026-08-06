import { PDFParse } from 'pdf-parse';

export interface RasterizedPage {
  pageNumber: number;
  dataUrl: string;
}

export const OCR_RASTER_SCALE = 2;

export async function rasterizePdfPages(
  buffer: Buffer,
  pageCount?: number,
  onPage?: (pageNumber: number) => void,
): Promise<RasterizedPage[]> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const pages: RasterizedPage[] = [];
  try {
    const total = pageCount && pageCount > 0 ? pageCount : 0;
    for (let pageNumber = 1; pageNumber <= total; pageNumber++) {
      const result = await parser.getScreenshot({ scale: OCR_RASTER_SCALE, partial: [pageNumber] });
      if (result.pages[0]) {
        pages.push({ pageNumber, dataUrl: result.pages[0].dataUrl });
        onPage?.(pageNumber);
      }
    }
    return pages;
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}
