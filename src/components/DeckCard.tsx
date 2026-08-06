import React from 'react';
import { MCQItem, DeckConfig } from '../types';
import { getTemplateById } from '../templates/registry';
import { DeckSlideThumb } from './DeckSlideThumb';
import { Presentation, Sliders, Share2, Download, FileText, Trash2, Calendar } from 'lucide-react';

interface DeckCardProps {
  id: string;
  title: string;
  badgeTag?: string;
  questionCount: number;
  items: MCQItem[];
  config: DeckConfig;
  isCurrent?: boolean;
  lastUpdated?: string;
  subject?: string;
  appTheme?: 'dark' | 'light';
  // Actions — Open Slide Studio is always present; the rest are optional.
  onOpen: () => void;
  onSettings?: () => void;
  onSocial?: () => void;
  onDownload?: () => void;
  downloadDisabled?: boolean;
  downloadTitle?: string;
  onExportJson?: () => void;
  onDelete?: () => void;
}

// Shared deck card — the Home deck-collection card design, also used by the
// My Decks library. Primary action is "Open Slide Studio"; Deck Settings +
// Social Posts sit in a 2-col row below; My Decks-specific actions (Download,
// Export JSON, Delete) render as optional tertiary controls.
export const DeckCard: React.FC<DeckCardProps> = ({
  title,
  badgeTag,
  questionCount,
  items,
  config,
  isCurrent,
  lastUpdated,
  subject,
  appTheme = 'dark',
  onOpen,
  onSettings,
  onSocial,
  onDownload,
  downloadDisabled,
  downloadTitle,
  onExportJson,
  onDelete,
}) => {
  const isAppLight = appTheme === 'light';
  const tmpl = getTemplateById(config?.templateId || 'rakib-dark');
  const hasTertiary = onDownload || onExportJson || onDelete;

  return (
    <div
      className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-5 group ${
        isCurrent
          ? isAppLight
            ? 'bg-amber-50/90 border-amber-400 shadow-xl ring-2 ring-amber-400/40'
            : 'bg-slate-900 border-amber-500/60 shadow-2xl ring-2 ring-amber-500/30'
          : isAppLight
          ? 'glass-card-fatty-light hover:border-amber-400'
          : 'glass-card-fatty bg-slate-900/90 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Real first-slide thumbnail */}
      <DeckSlideThumb items={items} config={config} isCurrent={isCurrent} templateName={tmpl.name} />

      <div className="space-y-3">
        {/* Card Top Badge Header */}
        <div className={`flex items-center justify-between gap-2 border-b pb-3 ${isAppLight ? 'border-slate-200' : 'border-slate-800/60'}`}>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono ${
              isCurrent
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : isAppLight
                ? 'bg-slate-100 text-amber-700 border border-amber-300'
                : 'bg-slate-800 text-amber-300'
            }`}>
              {questionCount} Questions
            </span>
            {subject && (
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
                isAppLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-950 text-slate-300 border-slate-800'
              }`}>
                {subject}
              </span>
            )}
          </div>

          {lastUpdated && (
            <span className={`text-[10px] font-bold flex items-center gap-1 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <Calendar className="w-3 h-3" />
              {lastUpdated}
            </span>
          )}
        </div>

        {/* Title & Badge Tag */}
        <div>
          <h3 className={`text-base font-extrabold line-clamp-2 leading-snug ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
            {title}
          </h3>
          {(badgeTag || subject) && (
            <p className="text-xs font-bold text-amber-500 mt-1">{badgeTag || subject}</p>
          )}
        </div>

        {/* Theme Info */}
        <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
          isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <span className={`font-medium ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>Theme:</span>
          <span className="font-bold text-amber-400">{tmpl.name}</span>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-800/60">
        <button
          onClick={onOpen}
          className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow cursor-pointer transition-all"
          title={`Open "${title}" in Slide Studio`}
        >
          <Presentation className="w-4 h-4 stroke-[2.5]" />
          <span>Open Slide Studio</span>
        </button>

        {(onSettings || onSocial) && (
          <div className="grid grid-cols-2 gap-2">
            {onSettings && (
              <button
                onClick={onSettings}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  isAppLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
                title="Edit this deck's branding & settings"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Deck Settings</span>
              </button>
            )}
            {onSocial && (
              <button
                onClick={onSocial}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  isAppLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                    : 'bg-slate-950 hover:bg-slate-800 text-indigo-400 border-slate-800'
                }`}
                title="Create social media posts from this deck"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Social Posts</span>
              </button>
            )}
          </div>
        )}

        {onDownload && (
          <button
            onClick={onDownload}
            disabled={downloadDisabled}
            className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer ${
              downloadDisabled
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : isAppLight
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300'
                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40'
            }`}
            title={downloadTitle || `Download "${title}" as PPTX / PDF / PNG / ZIP`}
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Download Deck</span>
          </button>
        )}

        {hasTertiary && (
          <div className="flex items-center justify-between pt-1">
            <span className={`text-[10px] font-mono font-bold ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
              {questionCount} MCQs
            </span>
            <div className="flex items-center gap-3">
              {onExportJson && (
                <button
                  onClick={onExportJson}
                  className={`text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                    isAppLight ? 'text-amber-700 hover:text-amber-900' : 'text-amber-400 hover:text-amber-300'
                  }`}
                  title="Download this deck as re-importable JSON"
                >
                  <FileText className="w-3 h-3" />
                  Export JSON
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors cursor-pointer"
                  title="Delete Deck"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
