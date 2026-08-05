import React, { useState, useRef } from 'react';
import { MCQItem, DeckConfig } from '../types';
import { MathText } from './MathText';
import {
  Share2,
  Download,
  CheckCircle2,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Smartphone,
  Square,
  Maximize,
  Sliders,
  Type,
  Award,
  RefreshCw,
  Copy,
  User,
  BookOpen
} from 'lucide-react';
import html2canvas from 'html2canvas';

interface SocialPostGeneratorProps {
  items: MCQItem[];
  config: DeckConfig;
  appTheme: 'dark' | 'light';
}

export const SocialPostGenerator: React.FC<SocialPostGeneratorProps> = ({
  items,
  config,
  appTheme,
}) => {
  const isAppLight = appTheme === 'light';

  // Social Post State
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    items.length > 0 ? [items[0].id] : []
  );
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '9:16'>('1:1');
  const [postTemplate, setPostTemplate] = useState<
    'edtech_quiz' | 'minimal_card' | 'flashcard' | 'exam_highlight'
  >('edtech_quiz');
  const [postBgColor, setPostBgColor] = useState<string>('gradient_amber');
  const [customHeaderTitle, setCustomHeaderTitle] = useState<string>('আজকের কুইজ');
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(true);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const postCanvasRef = useRef<HTMLDivElement>(null);

  const currentItem = items[selectedQuestionIndex] || {
    id: 'sample',
    questionType: 'standard',
    stem: 'রুই মাছের হৃদপিণ্ডে কয়টি প্রকোষ্ঠ থাকে?',
    options: [
      { key: 'ক', text: '২টি' },
      { key: 'খ', text: '৪টি' },
      { key: 'গ', text: '৩টি' },
      { key: 'ঘ', text: '১টি' },
    ],
    answer: 'ক',
    explanation: 'রুই মাছের হৃদপিণ্ড দুই প্রকোষ্ঠ বিশিষ্ট (এক অলিন্দ ও এক নিলয়)।',
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllItems = () => {
    setSelectedItemIds(items.map((item) => item.id));
  };

  const deselectAllItems = () => {
    setSelectedItemIds([]);
  };

  // Export single social post PNG image
  const handleExportSinglePNG = async () => {
    if (!postCanvasRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(postCanvasRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `social_post_q${selectedQuestionIndex + 1}_${aspectRatio.replace(':', 'x')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exporting social post image:', err);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Background Styles Mapping
  const getBgStyle = () => {
    switch (postBgColor) {
      case 'gradient_amber':
        return 'bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/80 text-white';
      case 'gradient_blue':
        return 'bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white';
      case 'gradient_emerald':
        return 'bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 text-white';
      case 'clean_light':
        return 'bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50 text-slate-950';
      case 'pure_dark':
        return 'bg-slate-950 text-white';
      default:
        return 'bg-slate-900 text-white';
    }
  };

  // Aspect ratio container dimensions
  const getAspectClass = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square max-w-[500px]';
      case '4:5':
        return 'aspect-[4/5] max-w-[450px]';
      case '9:16':
        return 'aspect-[9/16] max-w-[360px]';
      default:
        return 'aspect-square max-w-[500px]';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div
        className={`p-6 lg:p-8 rounded-3xl border shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
          isAppLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Share2 className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <span>Social Media Post Generator</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-mono border border-amber-500/30">
                FB / Instagram / Story
              </span>
            </h2>
            <p className={`text-xs mt-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Create high-engagement social media cards, daily quiz posts & story banners from your MCQs!
            </p>
          </div>
        </div>

        <button
          onClick={handleExportSinglePNG}
          disabled={isExporting || items.length === 0}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-slate-950 font-black text-sm flex items-center gap-2.5 shadow-xl shadow-amber-500/20 cursor-pointer disabled:opacity-50 transition-all shrink-0"
        >
          {isExporting ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5 stroke-[2.5]" />
          )}
          <span>{isExporting ? 'Generating Image...' : 'Download Social Image'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT 5 COLUMNS: POST CONFIGURATION & CONTROLS */}
        <div className="lg:col-span-5 space-y-6">
          {/* Aspect Ratio Selector */}
          <div
            className={`p-5 rounded-3xl border shadow-xl space-y-4 ${
              isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <label className="text-xs font-extrabold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400" />
              1. Select Aspect Ratio & Platform
            </label>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setAspectRatio('1:1')}
                className={`p-3 rounded-2xl border font-bold flex flex-col items-center gap-1.5 transition-all ${
                  aspectRatio === '1:1'
                    ? 'bg-amber-500/10 border-amber-400 text-amber-400 shadow-md ring-1 ring-amber-400/50'
                    : isAppLight
                    ? 'bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Square className="w-5 h-5" />
                <span>1:1 Square</span>
                <span className="text-[9px] font-mono opacity-80">(FB / Insta Post)</span>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('4:5')}
                className={`p-3 rounded-2xl border font-bold flex flex-col items-center gap-1.5 transition-all ${
                  aspectRatio === '4:5'
                    ? 'bg-amber-500/10 border-amber-400 text-amber-400 shadow-md ring-1 ring-amber-400/50'
                    : isAppLight
                    ? 'bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Maximize className="w-5 h-5" />
                <span>4:5 Portrait</span>
                <span className="text-[9px] font-mono opacity-80">(Insta Feed)</span>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`p-3 rounded-2xl border font-bold flex flex-col items-center gap-1.5 transition-all ${
                  aspectRatio === '9:16'
                    ? 'bg-amber-500/10 border-amber-400 text-amber-400 shadow-md ring-1 ring-amber-400/50'
                    : isAppLight
                    ? 'bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span>9:16 Story</span>
                <span className="text-[9px] font-mono opacity-80">(Reels / Story)</span>
              </button>
            </div>
          </div>

          {/* Background Theme Selector */}
          <div
            className={`p-5 rounded-3xl border shadow-xl space-y-4 ${
              isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <label className="text-xs font-extrabold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              2. Post Background Color & Gradient
            </label>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'gradient_amber', name: '🌙 Midnight Gold', bg: 'from-slate-950 to-amber-950' },
                { id: 'gradient_blue', name: '📘 Cyber Blue', bg: 'from-slate-950 to-indigo-950' },
                { id: 'gradient_emerald', name: '🌿 Forest Emerald', bg: 'from-slate-950 to-emerald-950' },
                { id: 'clean_light', name: '☀️ Warm Light', bg: 'from-slate-50 to-amber-50' },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setPostBgColor(b.id)}
                  className={`p-3 rounded-2xl border font-bold text-left transition-all flex items-center gap-2.5 ${
                    postBgColor === b.id
                      ? 'bg-amber-500/10 border-amber-400 text-amber-300 shadow-md'
                      : isAppLight
                      ? 'bg-slate-100 border-slate-200 text-slate-800'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-gradient-to-r ${b.bg} border shrink-0`} />
                  <span className="truncate">{b.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Text Controls */}
          <div
            className={`p-5 rounded-3xl border shadow-xl space-y-4 ${
              isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <label className="text-xs font-extrabold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <Type className="w-4 h-4 text-amber-400" />
              3. Post Banner Header & Display Settings
            </label>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Post Header Banner Title:</label>
                <input
                  type="text"
                  value={customHeaderTitle}
                  onChange={(e) => setCustomHeaderTitle(e.target.value)}
                  placeholder="e.g. আজকের কুইজ | এইচএসসি জীববিজ্ঞান"
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-bold ${
                    isAppLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between pt-1 text-xs font-semibold">
                <span>Highlight Correct Answer Option</span>
                <input
                  type="checkbox"
                  checked={showAnswerKey}
                  onChange={(e) => setShowAnswerKey(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Include Short Explanation Text</span>
                <input
                  type="checkbox"
                  checked={showExplanation}
                  onChange={(e) => setShowExplanation(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Question Selector List */}
          <div
            className={`p-5 rounded-3xl border shadow-xl space-y-3 ${
              isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-amber-500 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                4. Select Question To Post ({items.length})
              </label>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {items.map((q, idx) => {
                const isSelected = idx === selectedQuestionIndex;
                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => setSelectedQuestionIndex(idx)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 text-xs ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-400 text-amber-300 font-bold'
                        : isAppLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="truncate">
                      #{idx + 1}. <MathText text={q.stem} />
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT 7 COLUMNS: LIVE SOCIAL POST CARD CANVAS PREVIEW */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center justify-between w-full max-w-[500px]">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Live Social Post Preview ({aspectRatio})</span>
            </span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              High Res Export
            </span>
          </div>

          {/* Live Scaled Canvas Card */}
          <div
            ref={postCanvasRef}
            style={{ fontFamily: config.fontFamily || "'Kalpurush', serif" }}
            className={`w-full ${getAspectClass()} ${getBgStyle()} rounded-3xl p-6 lg:p-8 shadow-2xl border border-slate-700/80 flex flex-col justify-between relative overflow-hidden select-none transition-all`}
          >
            {/* Top Brand Banner Bar */}
            <div className="flex items-center justify-between border-b border-white/15 pb-4 z-10">
              <div className="flex items-center gap-3">
                {config.logoUrl ? (
                  <img
                    src={config.logoUrl}
                    alt="Logo"
                    className="w-10 h-10 object-contain rounded-xl bg-black/20 p-1 border border-white/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                    {config.brandName ? config.brandName.charAt(0).toUpperCase() : 'R'}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-black tracking-wide uppercase leading-tight drop-shadow-sm">
                    {config.brandName || "RAKIB'S CLASSROOM"}
                  </h3>
                  <p className="text-xs font-bold text-amber-400 mt-0.5">
                    {customHeaderTitle || config.headerTitle || 'আজকের কুইজ'}
                  </p>
                </div>
              </div>

              {config.badgeTag && (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                  {config.badgeTag}
                </span>
              )}
            </div>

            {/* Question Stem Box */}
            <div className="my-auto py-4 space-y-4 z-10">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shadow">
                  {selectedQuestionIndex + 1}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  প্রশ্নঃ
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold leading-relaxed text-white drop-shadow">
                <MathText text={currentItem.stem} />
              </h2>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {currentItem.options.map((opt) => {
                  const isCorrect = showAnswerKey && (opt.isCorrect || opt.key.toLowerCase() === currentItem.answer?.toLowerCase());
                  return (
                    <div
                      key={opt.key}
                      className={`p-3 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
                        isCorrect
                          ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg font-black'
                          : 'bg-white/10 border-white/15 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center font-mono ${
                          isCorrect ? 'bg-slate-950 text-amber-300 font-bold' : 'bg-white/15 text-white'
                        }`}>
                          {opt.key}
                        </span>
                        <span><MathText text={opt.text} /></span>
                      </div>
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-slate-950" />}
                    </div>
                  );
                })}
              </div>

              {/* Optional Explanation */}
              {showExplanation && currentItem.explanation && (
                <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-xs text-amber-200 mt-2">
                  <strong>ব্যাখ্যা:</strong> <MathText text={currentItem.explanation} />
                </div>
              )}
            </div>

            {/* Footer Watermark Bar */}
            <div className="flex items-center justify-between border-t border-white/15 pt-3 text-xs font-bold z-10">
              <span className="flex items-center gap-1.5 text-slate-300">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>{config.watermarkHandle || 'Hasnat Shuvro'}</span>
              </span>
              <span className="font-mono text-amber-400 font-extrabold tracking-widest uppercase">
                {config.footerTag || 'BIOMISSION'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
