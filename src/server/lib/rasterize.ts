import { PDFParse } from 'pdf-parse';

export interface RasterizedPage {
  pageNumber: number;
  dataUrl: string;
}

export const OCR_RASTER_SCALE = 2;

export async function rasterizePdfPages(buffer: Buffer): Promise<RasterizedPage[]> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getScreenshot({ scale: OCR_RASTER_SCALE });
    return result.pages.map((p) => ({
      pageNumber: p.pageNumber,
      dataUrl: p.dataUrl,
    }));
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}
