import React, { useState } from 'react';
import { DeckConfig, MCQItem } from '../types';
import {
  AnswerDisplayStyle,
  AnswerMode,
  DEFAULT_ANSWER_DISPLAY_STYLES,
  getEffectiveAnswerDisplayStyles,
} from '../utils/answerSlides';
import {
  X,
  Eye,
  CheckCircle2,
  Sparkles,
  Sliders,
  Palette,
  FileText,
  Presentation,
  Check,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface AnswerModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DeckConfig;
  activeSlideConfig?: Partial<DeckConfig>;
  onApplyConfig: (updated: DeckConfig) => void;
  onApplyActiveSlideConfig?: (updatedOverride: Partial<DeckConfig>) => void;
  onAppendAnswerSlidesToDeck?: () => void;
  totalQuestions: number;
  appTheme: 'dark' | 'light';
  // Global App Defaults context: no per-slide scope, custom copy/button label.
  hideScope?: boolean;
  title?: string;
  description?: string;
  applyButtonLabel?: string;
}

export const AnswerModeModal: React.FC<AnswerModeModalProps> = ({
  isOpen,
  onClose,
  config,
  activeSlideConfig,
  onApplyConfig,
  onApplyActiveSlideConfig,
  onAppendAnswerSlidesToDeck,
  totalQuestions,
  appTheme,
  hideScope = false,
  title = 'Answer Mode & Reveal Settings',
  description = 'Configure answer highlights, badge pills, explanation cards, and dedicated answer slides.',
  applyButtonLabel = 'Apply Answer Settings',
}) => {
  const isLight = appTheme === 'light';

  // Scope: 'global' (Deck-Wide) or 'slide' (Active Slide Only)
  const [scope, setScope] = useState<'global' | 'slide'>('global');

  const activeEffectiveConfig = { ...config, ...(activeSlideConfig || {}) };
  const targetConfig = scope === 'slide' ? activeEffectiveConfig : config;

  // Selected Display Styles state (multi-select)
  const [selectedStyles, setSelectedStyles] = useState<AnswerDisplayStyle[]>(() =>
    getEffectiveAnswerDisplayStyles(targetConfig)
  );

  // Dedicated Answer Slides toggle state ('separate_slide' vs 'highlight')
  const [useSeparateSlides, setUseSeparateSlides] = useState<boolean>(() =>
    targetConfig.answerMode === 'separate_slide'
  );

  if (!isOpen) return null;

  const toggleStyle = (style: AnswerDisplayStyle) => {
    setSelectedStyles(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const handleSave = () => {
    const updatedStyles = selectedStyles;
    const nextMode: AnswerMode = useSeparateSlides ? 'separate_slide' : 'highlight';
    const showExplanation = updatedStyles.includes('explanation_card');
    const showAnswer = updatedStyles.includes('highlight_option') || updatedStyles.includes('answer_pill');

    if (scope === 'slide' && onApplyActiveSlideConfig) {
      onApplyActiveSlideConfig({
        answerMode: nextMode,
        answerDisplayStyles: updatedStyles,
        showAnswerInSlide: showAnswer,
        showExplanationInSlide: showExplanation,
      });
    } else {
      onApplyConfig({
        ...config,
        answerMode: nextMode,
        answerDisplayStyles: updatedStyles,
        showAnswerInSlide: showAnswer,
        showExplanationInSlide: showExplanation,
      });
    }
    onClose();
  };

  const applyPreset = (styles: AnswerDisplayStyle[], separate: boolean) => {
    setSelectedStyles(styles);
    setUseSeparateSlides(separate);
  };

  const totalSlidesCalculated = useSeparateSlides ? totalQuestions * 2 : totalQuestions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-fadeIn select-none">
      <div
        className={`w-full max-w-2xl max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {/* HEADER */}
        <div className={`p-6 border-b flex items-center justify-between ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/60'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20">
              <Eye className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">{title}</h2>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SCOPE SELECTOR SWITCH — hidden in Global App Defaults context */}
          {!hideScope && (
          <div className={`p-1.5 rounded-2xl border flex items-center gap-1 ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <button
              onClick={() => setScope('global')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
                scope === 'global'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              🌐 Apply Deck-Wide (All Slides)
            </button>
            <button
              onClick={() => setScope('slide')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
                scope === 'slide'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              📄 Apply to Active Slide Only
            </button>
          </div>
          )}

          {/* MULTI-SELECT ANSWER DISPLAY ELEMENTS */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center justify-between">
              <span>Answer Display Features (Select Multiple)</span>
              <span className="text-[10px] font-normal text-slate-400">Combine any visual elements</span>
            </label>

            <div className="grid grid-cols-1 gap-3">
              {/* FEATURE 1: OPTION COLORING */}
              <div
                onClick={() => toggleStyle('highlight_option')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  selectedStyles.includes('highlight_option')
                    ? isLight
                      ? 'bg-amber-50 border-amber-500 shadow-md'
                      : 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/10'
                    : isLight
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedStyles.includes('highlight_option') ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold flex items-center gap-2">
                      <span>Coloring Answer Option</span>
                      {selectedStyles.includes('highlight_option') && (
                        <span className="text-[10px] font-black uppercase text-amber-500">Active</span>
                      )}
                    </h4>
                    <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Highlight correct option card with theme borders, background glow & checkmark badge.
                    </p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                  selectedStyles.includes('highlight_option')
                    ? 'bg-amber-500 border-amber-400 text-slate-950'
                    : isLight ? 'border-slate-300 bg-slate-100' : 'border-slate-700 bg-slate-900'
                }`}>
                  {selectedStyles.includes('highlight_option') && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>

              {/* FEATURE 2: ANSWER PILL / BADGE */}
              <div
                onClick={() => toggleStyle('answer_pill')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  selectedStyles.includes('answer_pill')
                    ? isLight
                      ? 'bg-emerald-50 border-emerald-500 shadow-md'
                      : 'bg-emerald-500/15 border-emerald-400 shadow-lg shadow-emerald-500/10'
                    : isLight
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedStyles.includes('answer_pill') ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold flex items-center gap-2">
                      <span>Answer Pill / Badge</span>
                      {selectedStyles.includes('answer_pill') && (
                        <span className="text-[10px] font-black uppercase text-emerald-400">Active</span>
                      )}
                    </h4>
                    <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Display a prominent top-center pill badge showing the correct answer (e.g. <strong className="text-emerald-400">উত্তর: গ</strong>).
                    </p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                  selectedStyles.includes('answer_pill')
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                    : isLight ? 'border-slate-300 bg-slate-100' : 'border-slate-700 bg-slate-900'
                }`}>
                  {selectedStyles.includes('answer_pill') && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>

              {/* FEATURE 3: EXPLANATION CARD */}
              <div
                onClick={() => toggleStyle('explanation_card')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  selectedStyles.includes('explanation_card')
                    ? isLight
                      ? 'bg-sky-50 border-sky-500 shadow-md'
                      : 'bg-sky-500/15 border-sky-400 shadow-lg shadow-sky-500/10'
                    : isLight
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedStyles.includes('explanation_card') ? 'bg-sky-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold flex items-center gap-2">
                      <span>Explanation Card</span>
                      {selectedStyles.includes('explanation_card') && (
                        <span className="text-[10px] font-black uppercase text-sky-400">Active</span>
                      )}
                    </h4>
                    <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Include detailed answer explanation box at the bottom of the slide canvas.
                    </p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                  selectedStyles.includes('explanation_card')
                    ? 'bg-sky-400 border-sky-300 text-slate-950'
                    : isLight ? 'border-slate-300 bg-slate-100' : 'border-slate-700 bg-slate-900'
                }`}>
                  {selectedStyles.includes('explanation_card') && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
            </div>
          </div>

          {/* DEDICATED ANSWER SLIDES TOGGLE */}
          <div className={`p-5 rounded-3xl border-2 transition-all ${
            useSeparateSlides
              ? 'bg-purple-500/10 border-purple-500/50 shadow-xl'
              : isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  useSeparateSlides ? 'bg-purple-500 text-white font-black' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Presentation className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold flex items-center gap-2">
                    <span>Include Dedicated Answer Slides in Active Deck</span>
                    {useSeparateSlides && (
                      <span className="text-[10px] font-black uppercase text-purple-400 font-mono">
                        {totalQuestions} Qs → {totalSlidesCalculated} Slides
                      </span>
                    )}
                  </h4>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Adds an extra dedicated answer slide right after each question slide in the presentation.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUseSeparateSlides(prev => !prev)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  useSeparateSlides ? 'bg-purple-500' : isLight ? 'bg-slate-300' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    useSeparateSlides ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* QUICK PRESETS */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyPreset(['highlight_option', 'answer_pill', 'explanation_card'], false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                ✨ Full In-Place Reveal (All 3)
              </button>
              <button
                onClick={() => applyPreset(['highlight_option'], false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                🎨 Option Highlight Only
              </button>
              <button
                onClick={() => applyPreset(['answer_pill'], false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                🏷️ Answer Pill Only
              </button>
              <button
                onClick={() => applyPreset(['highlight_option', 'answer_pill', 'explanation_card'], true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isLight ? 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-800' : 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/40 text-purple-300'
                }`}
              >
                🎬 Dedicated Answer Slides Mode
              </button>
              {onAppendAnswerSlidesToDeck && (
                <button
                  onClick={onAppendAnswerSlidesToDeck}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isLight ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-300'
                  }`}
                  title="Physically append an answer copy slide after every question in the deck items list"
                >
                  ➕ Append Answer Slides to Deck
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className={`p-4 border-t flex items-center justify-between ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950'
        }`}>
          <div className="text-xs text-slate-400 font-mono">
            {hideScope ? 'Scope: Global App Defaults' : scope === 'global' ? 'Scope: Global (All Slides)' : 'Scope: Active Slide Only'}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all cursor-pointer"
            >
              {applyButtonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
