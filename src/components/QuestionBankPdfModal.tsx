import React, { useState, useRef, useEffect } from 'react';
import { MCQItem, DeckConfig, getSourceTags, getEffectiveBadgeTag } from '../types';
import { getTemplateById, TEMPLATES, resolveTheme } from '../templates/registry';
import { getBackgroundPresetUrl } from '../utils/backgroundPresets';
import { MathText } from './MathText';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Download, FileText, Loader2, X, Layers, CheckCircle2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Question Bank PDF export — render selected MCQs as a printable A4 paper with
// a user-selectable template (header/footer branding themed like the slides),
// configurable MCQs-per-page, editable file name, live first-page preview.
// ---------------------------------------------------------------------------

const PAGE_W = 794; // A4 @ 96dpi
const PAGE_H = 1123;

const banglaDigits = (n: number) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]);

import { PdfAnswerFormat } from './DeckQuestionPaperModal';

interface QuestionBankPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MCQItem[];
  config: DeckConfig;
  appTheme?: 'dark' | 'light';
}

const paperFont = (config: DeckConfig) =>
  `${config.fontFamily || "'Kalpurush', serif"}, 'Hind Siliguri', 'Noto Sans Bengali', sans-serif`;

// Themed A4 page — header/footer colors follow the selected template's accent palette
const PaperPage = ({
  items,
  config,
  startNumber,
  pageNumber,
  pageTotal,
  answerKey,
  answerFormat = 'end_page',
}: {
  items: MCQItem[];
  config: DeckConfig;
  startNumber: number; // 0-based index of the first MCQ on this page across the whole set
  pageNumber: number; // 1-based page number
  pageTotal: number;
  answerKey?: boolean;
  answerFormat?: PdfAnswerFormat;
}) => {
  const theme = resolveTheme(config);
  const colors = theme.colors;
  const accent = theme.colors.accentColor;
  const isLightTmpl = theme.isLight;

  const qNumber = (idx: number) => {
    const n = idx + 1;
    return config.questionNumberFormat === 'bangla' ? banglaDigits(n) : String(n);
  };

  const ink = theme.colors.ink;
  const inkMuted = theme.colors.inkMuted;
  const titleInk = theme.colors.titleInk;
  const cardBorder = theme.colors.cardBorderInk;

  // Full-page background mirrors the slide: theme bg color for dark templates
  // + the deck's background preset graphics (cover) + a readability tint layer.
  const bgUrl = theme.background.url;
  const bgOpacity = theme.background.opacity;
  const overlayDarkness = theme.background.overlayDarkness;
  const pageBg = isLightTmpl ? '#ffffff' : theme.colors.bg;

  return (
    <div
      style={{
        position: 'relative',
        width: PAGE_W,
        height: PAGE_H,
        background: pageBg,
        color: ink,
        fontFamily: paperFont(config),
        display: 'flex',
        flexDirection: 'column',
        padding: '0 36px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* FULL-PAGE BACKGROUND GRAPHICS — preset image + readability tint (dark themes only) */}
      {!isLightTmpl && bgUrl && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("${bgUrl}")`,
            backgroundSize: config.bgImageFit === 'contain' ? 'contain' : config.bgImageFit === 'stretch' ? '100% 100%' : 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: bgOpacity,
          }}
        />
      )}
      {!isLightTmpl && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: `rgba(15, 23, 42, ${overlayDarkness})`,
          }}
        />
      )}

      {/* HEADER — slide header branding themed by template accent */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '18px 0 12px',
          borderBottom: `3px solid ${accent}`,
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
              color: titleInk,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {config.brandName || "NOBEL'S CLASSROOM"}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: accent, marginTop: 2 }}>
            {config.headerTitle || ''}
          </div>
        </div>
        {getEffectiveBadgeTag(config) && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: colors.badgeText,
              background: `#${colors.badgeFill}`,
              border: `1px solid ${accent}`,
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
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 14, overflow: 'hidden' }}>
        {answerKey ? (
          /* ANSWER KEY PAGE */
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                borderBottom: `2px solid ${cardBorder}`,
                paddingBottom: 8,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  background: accent,
                  color: '#ffffff',
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
                      border: `1px solid ${cardBorder}`,
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 13,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ color: inkMuted, fontWeight: 800 }}>{qNumber(startNumber + idx)}.</span>
                    <span
                      style={{
                        background: accent,
                        color: '#ffffff',
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
            {items.map((item, oIdx) => {
              const correctOpt = item.options.find(
                (o) => o.isCorrect || o.key.toLowerCase() === item.answer?.toLowerCase()
              );
              return (
                <div
                  key={item.id}
                  style={{
                    border: `1px solid ${cardBorder}`,
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
                        background: accent,
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
                      {qNumber(startNumber + oIdx)}
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.45, flex: 1 }}>
                      <MathText text={item.stem} />
                    </div>
                  </div>

                  {/* Passage / Roman / Prompt */}
                  {item.passage && (
                    <div style={{ margin: '6px 0 0 30px', fontSize: 12, lineHeight: 1.5, fontStyle: 'italic', color: inkMuted }}>
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
                    <div style={{ margin: '4px 0 0 30px', fontSize: 12, fontWeight: 700, fontStyle: 'italic', color: accent }}>
                      {item.prompt}
                    </div>
                  )}

                  {/* Inline Answer Pill Format */}
                  {answerFormat === 'inline_pill' && (correctOpt || item.answer) && (
                    <div
                      style={{
                        margin: '6px 0 2px 30px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: isLightTmpl ? '#d1fae5' : '#064e3b',
                        color: isLightTmpl ? '#065f46' : '#a7f3d0',
                        border: `1px solid ${isLightTmpl ? '#6ee7b7' : '#059669'}`,
                        borderRadius: 6,
                        padding: '3px 9px',
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      <span>✓ উত্তর:</span>
                      <span style={{ fontWeight: 800 }}>({correctOpt?.key || item.answer})</span>
                      {correctOpt?.text && (
                        <span><MathText text={correctOpt.text} /></span>
                      )}
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
                    {item.options.map((opt, oi) => {
                      const isCorrect = opt.isCorrect || opt.key.toLowerCase() === item.answer?.toLowerCase();
                      const isHighlighted = answerFormat === 'in_question_highlight' && isCorrect;

                      return (
                        <div
                          key={oi}
                          style={{
                            fontSize: 12,
                            lineHeight: 1.45,
                            display: 'flex',
                            gap: 5,
                            alignItems: 'center',
                            borderRadius: 6,
                            padding: isHighlighted ? '3px 8px' : '2px 0',
                            background: isHighlighted
                              ? (isLightTmpl ? '#d1fae5' : '#064e3b')
                              : 'transparent',
                            border: isHighlighted
                              ? `1.5px solid ${isLightTmpl ? '#10b981' : '#34d399'}`
                              : '1.5px solid transparent',
                            color: isHighlighted
                              ? (isLightTmpl ? '#064e3b' : '#ecfdf5')
                              : ink,
                          }}
                        >
                          <span style={{ fontWeight: 800, color: isHighlighted ? '#10b981' : accent }}>
                            {opt.key})
                          </span>
                          <span style={{ flex: 1, fontWeight: isHighlighted ? 800 : 600 }}>
                            <MathText text={opt.text} />
                          </span>
                          {isHighlighted && (
                            <span style={{ fontWeight: 800, color: '#10b981', fontSize: 12 }}>✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {getSourceTags(item).length > 0 && (
                    <div style={{ margin: '4px 0 0 30px', fontSize: 10, fontWeight: 700, color: inkMuted }}>
                      {getSourceTags(item).join(' · ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER — slide footer branding themed by template accent */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '10px 0 16px',
          borderTop: '1px solid #e2e8f0',
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          fontSize: 11,
          fontWeight: 700,
          color: inkMuted,
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '40%' }}>
          {config.watermarkHandle || 'Hasnat Shuvro'}
        </span>
        <span style={{ color: accent, fontWeight: 800 }}>
          {answerKey ? 'উত্তরমালা' : `Page ${pageNumber} of ${pageTotal}`}
        </span>
        <span style={{ textTransform: 'uppercase', letterSpacing: 1, color: accent, fontWeight: 800, whiteSpace: 'nowrap' }}>
          {config.footerTag || 'BIOMISSION'}
        </span>
      </div>
    </div>
  );
};

// Lightweight wrapper so the offscreen page node can be targeted by ref for toPng
const OffscreenPage = React.forwardRef<
  HTMLDivElement,
  {
    items: MCQItem[];
    config: DeckConfig;
    startNumber: number;
    pageNumber: number;
    pageTotal: number;
    answerKey: boolean;
    answerFormat: PdfAnswerFormat;
  }
>(({ items, config, startNumber, pageNumber, pageTotal, answerKey, answerFormat }, ref) => (
  <div ref={ref} style={{ width: PAGE_W, height: PAGE_H, boxSizing: 'border-box' }}>
    <PaperPage
      items={items}
      config={config}
      startNumber={startNumber}
      pageNumber={pageNumber}
      pageTotal={pageTotal}
      answerKey={answerKey}
      answerFormat={answerFormat}
    />
  </div>
));
OffscreenPage.displayName = 'OffscreenPage';

export const QuestionBankPdfModal: React.FC<QuestionBankPdfModalProps> = ({
  isOpen,
  onClose,
  items,
  config,
  appTheme = 'dark',
}) => {
  const isAppLight = appTheme === 'light';
  const [isExporting, setIsExporting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [fileName, setFileName] = useState<string>(() =>
    `${(config.deckName || config.brandName || 'QuestionBank').replace(/[^a-z0-9]+/gi, '_')}_MCQs`
  );
  // Track whether the user has typed a custom name — a fresh open keeps the
  // deck/brand-derived default unless they edited it for the current deck.
  const fileNameEditedRef = useRef<boolean>(false);
  useEffect(() => {
    if (isOpen && !fileNameEditedRef.current) {
      setFileName(`${(config.deckName || config.brandName || 'QuestionBank').replace(/[^a-z0-9]+/gi, '_')}_MCQs`);
    }
  }, [isOpen, config.deckName, config.brandName]);
  const [templateId, setTemplateId] = useState<string>(config.templateId);
  const [itemsPerPage, setItemsPerPage] = useState<number>(3);
  const [answerFormat, setAnswerFormat] = useState<PdfAnswerFormat>('end_page');
  const [includeAnswerKey, setIncludeAnswerKey] = useState<boolean>(true);
  // Page slice currently mounted in the offscreen render node (drives PDF pages)
  const [renderSlice, setRenderSlice] = useState<{ start: number; items: MCQItem[]; pageNumber: number; answerKey: boolean }>({
    start: 0,
    items: [],
    pageNumber: 1,
    answerKey: false,
  });
  const pageRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Effective config — selected template + any custom accent color
  const effectiveConfig: DeckConfig = {
    ...config,
    templateId,
    customTheme: templateId === 'custom-theme' ? config.customTheme : undefined,
  };

  const perPage = Math.max(1, Math.min(6, itemsPerPage));
  const pages: { start: number; items: MCQItem[] }[] = [];
  for (let i = 0; i < items.length; i += perPage) {
    pages.push({ start: i, items: items.slice(i, i + perPage) });
  }
  const firstPage = pages[0] || { start: 0, items: [] };

  // Preview scale — fit a 794px wide page into the modal column
  const previewScale = 0.56;

  const renderPdf = async () => {
    if (items.length === 0) return;
    setIsExporting(true);
    try {
      await document.fonts.ready;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [PAGE_W, PAGE_H] });
      let addedPage = 0;

      for (let p = 0; p < pages.length; p++) {
        setRenderSlice({ start: pages[p].start, items: pages[p].items, pageNumber: p + 1, answerKey: false });
        setProgressMsg(`Rendering page ${p + 1} of ${pages.length + (answerFormat === 'end_page' && includeAnswerKey ? 1 : 0)}...`);
        await new Promise((r) => setTimeout(r, 150));
        const el = pageRef.current;
        if (!el) continue;
        const dataUrl = await toPng(el, { pixelRatio: 2, cacheBust: true });
        if (addedPage > 0) pdf.addPage([PAGE_W, PAGE_H], 'portrait');
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfW, pdfH);
        addedPage++;
      }

      if (answerFormat === 'end_page' && includeAnswerKey) {
        setRenderSlice({ start: 0, items, pageNumber: pages.length + 1, answerKey: true });
        setProgressMsg('Rendering answer key page...');
        await new Promise((r) => setTimeout(r, 150));
        const el = pageRef.current;
        if (el) {
          const dataUrl = await toPng(el, { pixelRatio: 2, cacheBust: true });
          pdf.addPage([PAGE_W, PAGE_H], 'portrait');
          const pdfW = pdf.internal.pageSize.getWidth();
          const pdfH = pdf.internal.pageSize.getHeight();
          pdf.addImage(dataUrl, 'PNG', 0, 0, pdfW, pdfH);
        }
      }

      setProgressMsg('Saving PDF...');
      const safeName = fileName.trim() || 'QuestionBank_MCQs';
      pdf.save(`${safeName.replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]/g, '_')}.pdf`);
    } catch (err: any) {
      console.error('Question Bank PDF Export Error:', err);
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setIsExporting(false);
      setProgressMsg('');
      setRenderSlice({ start: 0, items: firstPage.items, pageNumber: 1, answerKey: false });
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-modal-backdrop ${
      isAppLight ? 'bg-black/40' : 'bg-black/80'
    }`}>
      <div className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} relative w-full max-w-4xl border p-6 lg:p-8 space-y-6 max-h-[90vh] overflow-y-auto animate-modal-card ${
        isAppLight ? 'border-slate-200' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <button
          onClick={onClose}
          disabled={isExporting}
          className={`absolute top-5 right-5 p-2.5 rounded-xl cursor-pointer transition-colors ${
            isAppLight ? 'bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className={`flex items-center gap-4 pb-4 border-b ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25">
            <FileText className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h3 className={`text-xl font-black ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
              Export Selected MCQs as PDF
            </h3>
            <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {items.length} question{items.length === 1 ? '' : 's'} selected — A4 paper with slide header &amp; footer branding
            </p>
          </div>
        </div>

        {/* Options */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl border ${
          isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          {/* File name */}
          <div>
            <label className={`block text-sm font-bold mb-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
              File Name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => {
                fileNameEditedRef.current = true;
                setFileName(e.target.value);
              }}
              placeholder="e.g. Biology_Chapter_8_MCQs"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-amber-500 ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
              }`}
            />
          </div>

          {/* Template */}
          <div>
            <label className={`block text-sm font-bold mb-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Template (Header / Footer Theme)
            </label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-amber-500 cursor-pointer ${
                isAppLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-amber-300'
              }`}
            >
              {config.customTheme && (
                <option value="custom-theme">Custom Built Theme (current deck)</option>
              )}
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* MCQs per page */}
          <div>
            <label className={`block text-sm font-bold mb-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
              MCQs per Page
            </label>
            <div className="flex items-center gap-1">
              {[2, 3, 4, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setItemsPerPage(n)}
                  className={`flex-1 h-10 rounded-lg text-sm font-black border transition-all cursor-pointer ${
                    itemsPerPage === n
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : isAppLight
                      ? 'bg-white text-slate-600 border-slate-300 hover:border-amber-400'
                      : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-amber-500/40'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Answer Format Selection */}
        <div className={`p-4 rounded-2xl border ${isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
          <label className={`block text-sm font-bold mb-2.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
            Select Answer Presentation Format
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => setAnswerFormat('none')}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                answerFormat === 'none'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                  : isAppLight ? 'bg-white border-slate-200 hover:border-slate-400 text-slate-800' : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
              }`}
            >
              <div className="text-xs font-black uppercase flex items-center gap-1 mb-1">
                🚫 Clean Exam
              </div>
              <div className="text-[11px] opacity-80 leading-tight">No answers shown (student exam mode)</div>
            </button>

            <button
              type="button"
              onClick={() => setAnswerFormat('end_page')}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                answerFormat === 'end_page'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                  : isAppLight ? 'bg-white border-slate-200 hover:border-slate-400 text-slate-800' : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
              }`}
            >
              <div className="text-xs font-black uppercase flex items-center gap-1 mb-1">
                📄 Answer Sheet
              </div>
              <div className="text-[11px] opacity-80 leading-tight">Answer key page (উত্তরমালা) at end</div>
            </button>

            <button
              type="button"
              onClick={() => setAnswerFormat('in_question_highlight')}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                answerFormat === 'in_question_highlight'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                  : isAppLight ? 'bg-white border-slate-200 hover:border-slate-400 text-slate-800' : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
              }`}
            >
              <div className="text-xs font-black uppercase flex items-center gap-1 mb-1">
                🎨 Color Box
              </div>
              <div className="text-[11px] opacity-80 leading-tight">Mark correct option with colored box</div>
            </button>

            <button
              type="button"
              onClick={() => setAnswerFormat('inline_pill')}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                answerFormat === 'inline_pill'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                  : isAppLight ? 'bg-white border-slate-200 hover:border-slate-400 text-slate-800' : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
              }`}
            >
              <div className="text-xs font-black uppercase flex items-center gap-1 mb-1">
                🏷️ Answer Pill
              </div>
              <div className="text-[11px] opacity-80 leading-tight">Show answer badge `[✓ উত্তর]` under stem</div>
            </button>
          </div>
        </div>

        {/* Answer key toggle (visible only when answerFormat is 'end_page') */}
        {answerFormat === 'end_page' && (
          <div className={`flex items-center justify-between gap-4 p-4 rounded-2xl border ${
            isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div>
              <h4 className={`text-sm font-bold ${isAppLight ? 'text-slate-900' : 'text-slate-100'}`}>Include Trailing Answer Key Page</h4>
              <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Append an answer key page (উত্তরমালা) listing every question's correct answer at the end of the PDF
              </p>
            </div>
            <label className={`flex items-center gap-2 text-xs font-bold cursor-pointer ${isAppLight ? 'text-slate-700' : 'text-slate-200'}`}>
              <input
                type="checkbox"
                checked={includeAnswerKey}
                onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              Answer Key
            </label>
          </div>
        )}

        {/* Preview */}
        <div>
          <div className={`flex items-center justify-between mb-2 ${
            isAppLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            <span className="text-sm font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              Preview — Page 1 of {pages.length || 1} ({firstPage.items.length} MCQ{firstPage.items.length === 1 ? '' : 's'})
            </span>
            <span className="text-xs font-semibold">
              {getTemplateById(templateId, effectiveConfig.customTheme).name}
            </span>
          </div>
          <div className={`rounded-2xl border overflow-hidden ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <div
              style={{
                height: Math.round(PAGE_H * previewScale),
                overflow: 'auto',
                display: 'flex',
                justifyContent: 'center',
                background: '#94a3b8',
              }}
            >
              <div
                style={{
                  width: PAGE_W,
                  height: PAGE_H,
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top left',
                  flexShrink: 0,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                }}
              >
                {firstPage.items.length > 0 && (
                  <PaperPage
                    items={firstPage.items}
                    config={effectiveConfig}
                    startNumber={firstPage.start}
                    pageNumber={1}
                    pageTotal={pages.length || 1}
                    answerKey={false}
                    answerFormat={answerFormat}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className={`text-xs font-semibold ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {pages.length} page{pages.length === 1 ? '' : 's'}{answerFormat === 'end_page' && includeAnswerKey ? ' + answer key' : ''} • A4 portrait • template-themed header/footer
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 ${
                isAppLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={renderPdf}
              disabled={isExporting || items.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 hover:brightness-110 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {progressMsg}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>

        {isExporting && (
          <div className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
            isAppLight ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{progressMsg}</span>
          </div>
        )}
      </div>

      {/* Hidden offscreen page — the slice here is swapped per page during PDF export */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          pointerEvents: 'none',
          zIndex: -100,
        }}
      >
        <OffscreenPage
          ref={pageRef}
          items={renderSlice.items.length > 0 ? renderSlice.items : firstPage.items}
          config={effectiveConfig}
          startNumber={renderSlice.items.length > 0 ? renderSlice.start : firstPage.start}
          pageNumber={renderSlice.items.length > 0 ? renderSlice.pageNumber : 1}
          pageTotal={pages.length || 1}
          answerKey={renderSlice.answerKey}
          answerFormat={answerFormat}
        />
      </div>
    </div>
  );
};

QuestionBankPdfModal.displayName = 'QuestionBankPdfModal';

