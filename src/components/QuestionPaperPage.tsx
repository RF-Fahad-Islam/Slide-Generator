import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { MCQItem, DeckConfig, getSourceTags, getEffectiveBadgeTag } from '../types';
import { MathText } from './MathText';
import { safeToPng } from '../utils/cleanExport';
import { getFontEmbedCSS } from '../utils/fontEmbed';
import jsPDF from 'jspdf';

// ---------------------------------------------------------------------------
// Question Paper PDF — printable A4 portrait pages using the deck's slide
// header/footer branding. N MCQs per page (configurable), optional answer key.
// ---------------------------------------------------------------------------

const PAGE_W = 794; // A4 @ 96dpi
const PAGE_H = 1123;

const banglaDigits = (n: number) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]);

export interface QuestionPaperHandle {
  renderPdf: (onProgress: (msg: string) => void) => Promise<void>;
}

interface QuestionPaperPageProps {
  items: MCQItem[];
  config: DeckConfig;
  itemsPerPage: number;
  includeAnswerKey: boolean;
}

const paperFont = (config: DeckConfig) =>
  `${config.fontFamily || "'Kalpurush', serif"}, 'Hind Siliguri', 'Noto Sans Bengali', sans-serif`;

export const QuestionPaperPage = forwardRef<QuestionPaperHandle, QuestionPaperPageProps>(
  ({ items, config, itemsPerPage, includeAnswerKey }, ref) => {
    const [activePage, setActivePage] = useState<number>(0); // -1 = answer key
    const pageRef = useRef<HTMLDivElement>(null);

    const perPage = Math.max(1, Math.min(6, itemsPerPage));
    const pages: MCQItem[][] = [];
    for (let i = 0; i < items.length; i += perPage) {
      pages.push(items.slice(i, i + perPage));
    }

    const isAnswerKeyPage = activePage === -1;
    const pageItems = pages[activePage] || [];

    useImperativeHandle(
      ref,
      () => ({
        renderPdf: async (onProgress) => {
          if (items.length === 0) return;
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
          const fontEmbedCSS = await getFontEmbedCSS();
          let addedPage = 0;

          for (let p = 0; p < pages.length; p++) {
            setActivePage(p);
            onProgress(`Rendering question paper page ${p + 1} of ${pages.length}...`);
            await new Promise((r) => setTimeout(r, 150));
            const el = pageRef.current;
            if (!el) continue;
            const dataUrl = await safeToPng(el, { pixelRatio: 2, cacheBust: true, fontEmbedCSS });
            if (addedPage > 0) pdf.addPage('a4', 'portrait');
            pdf.addImage(dataUrl, 'PNG', 0, 0, PAGE_W, PAGE_H);
            addedPage++;
          }

          if (includeAnswerKey) {
            setActivePage(-1);
            onProgress('Rendering answer key page...');
            await new Promise((r) => setTimeout(r, 150));
            const el = pageRef.current;
            if (el) {
              const dataUrl = await safeToPng(el, { pixelRatio: 2, cacheBust: true, fontEmbedCSS });
              pdf.addPage('a4', 'portrait');
              pdf.addImage(dataUrl, 'PNG', 0, 0, PAGE_W, PAGE_H);
            }
          }

          onProgress('Saving question paper PDF...');
          const paperPrefix = (config.deckName || config.brandName || 'QuestionPaper').replace(/\s+/g, '_');
          pdf.save(`${paperPrefix}_Question_Paper.pdf`);
        },
      }),
      [items, config, perPage, includeAnswerKey]
    );

    const qNumber = (idx: number) => {
      const n = idx + 1;
      return config.questionNumberFormat === 'bangla' ? banglaDigits(n) : String(n);
    };

    return (
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          pointerEvents: 'none',
          zIndex: -100,
        }}
      >
        <div
          ref={pageRef}
          style={{
            width: PAGE_W,
            height: PAGE_H,
            background: '#ffffff',
            color: '#0f172a',
            fontFamily: paperFont(config),
            display: 'flex',
            flexDirection: 'column',
            padding: '0 36px',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {/* HEADER — matches slide header branding */}
          <div
            style={{
              padding: '18px 0 12px',
              borderBottom: '3px solid #f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {config.brandName || "NOBEL'S CLASSROOM"}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#b45309', marginTop: 2 }}>
                {config.headerTitle || ''}
              </div>
            </div>
            {getEffectiveBadgeTag(config) && (
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#0f172a',
                  background: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: 8,
                  padding: '5px 10px',
                  whiteSpace: 'nowrap',
                  maxWidth: 300,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {getEffectiveBadgeTag(config)}
              </div>
            )}
          </div>

          {/* BODY */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 14, overflow: 'hidden' }}>
            {isAnswerKeyPage ? (
              /* ANSWER KEY PAGE */
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    borderBottom: '2px solid #e2e8f0',
                    paddingBottom: 8,
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      background: '#f59e0b',
                      color: '#0f172a',
                      borderRadius: 6,
                      padding: '2px 8px',
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    ANSWER KEY
                  </span>
                  <span>উত্তরমালা</span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: 8,
                  }}
                >
                  {items.map((q, idx) => {
                    const correct = q.options.find(
                      (o) => o.isCorrect || o.key.toLowerCase() === q.answer?.toLowerCase()
                    );
                    return (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: 8,
                          padding: '8px 10px',
                          fontSize: 13,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span style={{ color: '#64748b', fontWeight: 800 }}>{qNumber(idx)}.</span>
                        <span
                          style={{
                            background: '#f59e0b',
                            color: '#0f172a',
                            borderRadius: 5,
                            padding: '1px 7px',
                            fontWeight: 800,
                          }}
                        >
                          {correct?.key || q.answer}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* QUESTION PAGES */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pageItems.map((item, oIdx) => {
                  const globalIdx = activePage * perPage + oIdx;
                  return (
                    <div
                      key={item.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        padding: '10px 12px',
                        pageBreakInside: 'avoid',
                        breakInside: 'avoid',
                      }}
                    >
                      {/* Stem */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span
                          style={{
                            background: '#0f172a',
                            color: '#ffffff',
                            borderRadius: 6,
                            minWidth: 22,
                            height: 22,
                            fontSize: 13,
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 1,
                          }}
                        >
                          {qNumber(globalIdx)}
                        </span>
                        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.45, flex: 1 }}>
                          <MathText text={item.stem} />
                        </div>
                      </div>

                      {/* Passage / Roman / Prompt */}
                      {item.passage && (
                        <div style={{ margin: '6px 0 0 30px', fontSize: 12, lineHeight: 1.5, fontStyle: 'italic', color: '#334155' }}>
                          <MathText text={item.passage} />
                        </div>
                      )}
                      {item.romanItems && item.romanItems.length > 0 && (
                        <div style={{ margin: '5px 0 0 30px', fontSize: 12, lineHeight: 1.6 }}>
                          {item.romanItems.map((r, ri) => (
                            <div key={ri}>
                              <MathText text={r} />
                            </div>
                          ))}
                        </div>
                      )}
                      {item.prompt && (
                        <div style={{ margin: '4px 0 0 30px', fontSize: 12, fontWeight: 700, fontStyle: 'italic', color: '#b45309' }}>
                          {item.prompt}
                        </div>
                      )}

                      {/* Options */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '4px 12px',
                          margin: '6px 0 0 30px',
                        }}
                      >
                        {item.options.map((opt, oi) => (
                          <div key={oi} style={{ fontSize: 12, lineHeight: 1.45, display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                            <span style={{ fontWeight: 800, color: '#b45309' }}>{opt.key})</span>
                            <span style={{ flex: 1 }}>
                              <MathText text={opt.text} />
                            </span>
                          </div>
                        ))}
                      </div>

                      {getSourceTags(item).length > 0 && (
                        <div style={{ margin: '4px 0 0 30px', fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>
                          {getSourceTags(item).join(' · ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* FOOTER — matches slide footer branding */}
          <div
            style={{
              padding: '10px 0 16px',
              borderTop: '1px solid #e2e8f0',
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              fontSize: 11,
              fontWeight: 700,
              color: '#64748b',
            }}
          >
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '40%' }}>
              {config.watermarkHandle || 'Hasnat Shuvro'}
            </span>
            <span style={{ color: '#b45309', fontWeight: 800 }}>
              {isAnswerKeyPage ? 'উত্তরমালা' : `Page ${activePage + 1} of ${pages.length}`}
            </span>
            <span style={{ textTransform: 'uppercase', letterSpacing: 1, color: '#b45309', fontWeight: 800, whiteSpace: 'nowrap' }}>
              {config.footerTag || 'BIOMISSION'}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

QuestionPaperPage.displayName = 'QuestionPaperPage';
