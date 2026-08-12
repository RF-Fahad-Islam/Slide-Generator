import React from 'react';
import { SlidersHorizontal, CheckCircle2, Upload } from 'lucide-react';
import { DeckConfig } from '../../types';

interface LayoutBannerControlsProps {
  layoutMode?: 'standard' | 'class_mode';
  useHeaderBanner?: boolean;
  headerBannerUrl?: string;
  useFooterBanner?: boolean;
  footerBannerUrl?: string;
  onLayoutModeChange: (mode: 'standard' | 'class_mode') => void;
  onUseHeaderBannerChange: (val: boolean) => void;
  onHeaderBannerUrlChange: (val: string) => void;
  onUseFooterBannerChange: (val: boolean) => void;
  onFooterBannerUrlChange: (val: string) => void;
  onEnforceClassroomView?: () => void;
  isAppLight?: boolean;
}

export const LayoutBannerControls: React.FC<LayoutBannerControlsProps> = ({
  layoutMode = 'standard',
  useHeaderBanner = false,
  headerBannerUrl = '',
  useFooterBanner = false,
  footerBannerUrl = '',
  onLayoutModeChange,
  onUseHeaderBannerChange,
  onHeaderBannerUrlChange,
  onUseFooterBannerChange,
  onFooterBannerUrlChange,
  onEnforceClassroomView,
  isAppLight = false,
}) => {
  const handleBannerUpload = (
    setter: (val: string) => void,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setter(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className={`p-6 rounded-3xl border space-y-6 ${
        isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}
    >
      <div className={`border-b pb-4 ${isAppLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
        <h3
          className={`text-base font-extrabold uppercase tracking-wider flex items-center gap-2 ${
            isAppLight ? 'text-amber-700' : 'text-amber-300'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          Slide Layout Mode & Full-Width Custom Banners
        </h3>
        <p className={`text-sm mt-0.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Switch between Standard Presentation layout and Classroom View (live writing mode), or supply full-width graphic banners for Header & Footer
        </p>
      </div>

      {/* Layout Mode Selector Cards */}
      <div className="space-y-2">
        <label className={`text-sm font-bold block uppercase tracking-wider ${isAppLight ? 'text-slate-700' : 'text-slate-200'}`}>
          Slide Layout Format:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onLayoutModeChange('standard')}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
              layoutMode === 'standard'
                ? 'bg-amber-500/10 border-amber-400 text-amber-300 shadow-lg'
                : isAppLight
                ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${isAppLight ? 'text-slate-900' : 'text-white'}`}>🖥️ Standard Center Presentation</span>
              {layoutMode === 'standard' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
            </div>
            <p className={`text-sm leading-relaxed ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Classic 2-column options grid at bottom with question stem centered in the middle. Best for standard video recordings & projectors.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onEnforceClassroomView) {
                onEnforceClassroomView();
              } else {
                onLayoutModeChange('class_mode');
              }
            }}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
              layoutMode === 'class_mode'
                ? 'bg-amber-500/10 border-amber-400 text-amber-300 shadow-lg'
                : isAppLight
                ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${isAppLight ? 'text-slate-900' : 'text-white'}`}>📐 Classroom View</span>
              {layoutMode === 'class_mode' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
            </div>
            <p className={`text-sm leading-relaxed ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Question stem on top-left leaving wide blank room in center for live stylus writing & math derivation. Options stacked vertically on right!
            </p>
          </button>
        </div>
      </div>

      {/* Full Width Banners Section */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t ${isAppLight ? 'border-slate-200' : 'border-slate-900'}`}>
        {/* Header Banner */}
        <div className={`p-4 rounded-2xl border space-y-3 ${isAppLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-bold ${isAppLight ? 'text-slate-700' : 'text-slate-200'}`}>Full-Width Graphic Header Banner</span>
            <label className={`flex items-center gap-2 cursor-pointer text-sm font-bold ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}>
              <input
                type="checkbox"
                checked={!!useHeaderBanner}
                onChange={(e) => onUseHeaderBannerChange(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              Enable Header Banner Image
            </label>
          </div>

          {useHeaderBanner && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={headerBannerUrl}
                  onChange={(e) => onHeaderBannerUrlChange(e.target.value)}
                  placeholder="Paste header image banner URL or upload file"
                  className={`w-full border rounded-xl px-3 py-1.5 text-sm font-mono ${
                    isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
                <label className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-sm font-bold cursor-pointer shrink-0">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleBannerUpload(onHeaderBannerUrlChange, e)}
                    className="hidden"
                  />
                </label>
              </div>
              {headerBannerUrl && (
                <img src={headerBannerUrl} alt="Header Banner Preview" className="w-full max-h-16 object-contain rounded-lg border border-slate-800 bg-black/40" />
              )}
            </div>
          )}
        </div>

        {/* Footer Banner */}
        <div className={`p-4 rounded-2xl border space-y-3 ${isAppLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-bold ${isAppLight ? 'text-slate-700' : 'text-slate-200'}`}>Full-Width Graphic Footer Banner</span>
            <label className={`flex items-center gap-2 cursor-pointer text-sm font-bold ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}>
              <input
                type="checkbox"
                checked={!!useFooterBanner}
                onChange={(e) => onUseFooterBannerChange(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              Enable Footer Banner Image
            </label>
          </div>

          {useFooterBanner && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={footerBannerUrl}
                  onChange={(e) => onFooterBannerUrlChange(e.target.value)}
                  placeholder="Paste footer image banner URL or upload file"
                  className={`w-full border rounded-xl px-3 py-1.5 text-sm font-mono ${
                    isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
                <label className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-sm font-bold cursor-pointer shrink-0">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleBannerUpload(onFooterBannerUrlChange, e)}
                    className="hidden"
                  />
                </label>
              </div>
              {footerBannerUrl && (
                <img src={footerBannerUrl} alt="Footer Banner Preview" className="w-full max-h-16 object-contain rounded-lg border border-slate-800 bg-black/40" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
