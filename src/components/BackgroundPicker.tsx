import React, { useState } from 'react';
import { DeckConfig, BgImageFit } from '../types';
import { BACKGROUND_PRESETS } from '../utils/backgroundPresets';
import { BackgroundImageEditor, BgImageEditorResult } from './BackgroundImageEditor';
import { Upload, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

export interface BackgroundPickerValue {
  bgPreset: DeckConfig['bgPreset'];
  bgImageUrl?: string;
  bgImageFit?: BgImageFit;
  bgImageOpacity?: number;
  bgOverlayDarkness?: number;
}

interface BackgroundPickerProps {
  value: BackgroundPickerValue;
  onPatch: (patch: Partial<BackgroundPickerValue>) => void;
  isAppLight: boolean;
  title?: string;
  description?: string;
}

/**
 * Shared background source picker — used by both the per-deck DeckSettings
 * panel and the Global App Defaults page so the two never drift apart.
 * A custom image and a preset are mutually exclusive: the preset grid hides
 * itself while a custom image is active, and picking a preset clears any
 * custom image (see the `custom` bgPreset sentinel).
 */
export const BackgroundPicker: React.FC<BackgroundPickerProps> = ({
  value,
  onPatch,
  isAppLight,
  title = 'Slide Background Image & Textures',
  description = 'Select or upload a background image for every slide with custom overlay contrast',
}) => {
  const [bgEditorImage, setBgEditorImage] = useState<string | null>(null);
  const hasCustomBgImage = !!value.bgImageUrl;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setBgEditorImage(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgEditorApply = (result: BgImageEditorResult) => {
    onPatch({ bgImageUrl: result.dataUrl, bgPreset: 'custom', bgImageFit: result.fit });
    setBgEditorImage(null);
  };

  const handleClearCustomImage = () => {
    onPatch({
      bgImageUrl: '',
      bgPreset: value.bgPreset === 'custom' ? 'none' : value.bgPreset,
      bgImageFit: undefined,
    });
  };

  return (
    <div className={`p-6 rounded-3xl border space-y-6 ${
      isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
    }`}>
      <div className={`flex items-center justify-between border-b pb-4 ${
        isAppLight ? 'border-slate-200' : 'border-slate-800/80'
      }`}>
        <div>
          <h3 className={`text-base font-extrabold uppercase tracking-wider flex items-center gap-2 ${
            isAppLight ? 'text-amber-700' : 'text-amber-300'
          }`}>
            <ImageIcon className="w-4 h-4 text-amber-400" />
            {title}
          </h3>
          <p className={`text-sm mt-0.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {description}
          </p>
        </div>

        <label className="text-sm px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-pointer flex items-center gap-2 font-bold transition-all">
          <Upload className="w-4 h-4" />
          Upload Custom Background
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      </div>

      {/* Custom URL Input & Clear Row — upload lives in the section header above
          (single upload button for the custom background image). */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isAppLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className={`text-sm font-bold ${isAppLight ? 'text-slate-700' : 'text-slate-200'}`}>Custom Background Image URL:</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {hasCustomBgImage && (
              <>
                <button
                  type="button"
                  onClick={() => setBgEditorImage(value.bgImageUrl || null)}
                  className="text-sm px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold transition-all shrink-0"
                >
                  Re-edit Image
                </button>
                <button
                  type="button"
                  onClick={handleClearCustomImage}
                  className="text-sm px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold transition-all shrink-0"
                >
                  Clear Custom Image
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={value.bgImageUrl || ''}
            onChange={(e) => {
              const url = e.target.value;
              onPatch({ bgImageUrl: url, bgPreset: url ? 'custom' : value.bgPreset });
            }}
            placeholder="Paste image URL (e.g., https://images.unsplash.com/... or data:image/...)"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-amber-500 ${
              isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
            }`}
          />
        </div>

        {hasCustomBgImage && (
          <div className="flex items-center gap-3 pt-1">
            <div
              className="w-16 h-10 rounded-lg bg-cover bg-center border border-amber-400/50 shrink-0"
              style={{ backgroundImage: `url("${value.bgImageUrl}")` }}
            />
            <p className="text-sm text-amber-300 font-medium">
              Custom background image active — theme templates &amp; background colors are hidden until you clear the image.
            </p>
          </div>
        )}
      </div>

      {/* Presets Grid — hidden while a custom image is active, because the
          image replaces the theme background entirely. */}
      {!hasCustomBgImage && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {BACKGROUND_PRESETS.map((preset) => {
            const isSelected = value.bgPreset === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onPatch({ bgPreset: preset.id })}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/10'
                    : isAppLight
                    ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {/* Visual Thumbnail Bar */}
                <div className={`w-full h-12 rounded-xl bg-gradient-to-r ${preset.previewGradient} border border-white/10 mb-2 relative overflow-hidden`}>
                  {preset.url && (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-70"
                      style={{ backgroundImage: `url("${preset.url}")` }}
                    />
                  )}
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className={`text-sm font-bold ${isAppLight ? 'text-slate-900' : 'text-slate-100'}`}>{preset.name}</h4>
                  <p className={`text-sm mt-0.5 line-clamp-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>{preset.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Image Opacity & Tint Overlays */}
      {value.bgPreset !== 'none' && (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t ${
          isAppLight ? 'border-slate-200' : 'border-slate-900'
        }`}>
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-semibold">
              <span className={isAppLight ? 'text-slate-600' : 'text-slate-300'}>Background Image Opacity</span>
              <span className="text-amber-400 font-mono">{Math.round((value.bgImageOpacity ?? 0.85) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={value.bgImageOpacity ?? 0.85}
              onChange={(e) => onPatch({ bgImageOpacity: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-semibold">
              <span className={isAppLight ? 'text-slate-600' : 'text-slate-300'}>Text Readability Dark Overlay</span>
              <span className="text-amber-400 font-mono">{Math.round((value.bgOverlayDarkness ?? 0.4) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.85"
              step="0.05"
              value={value.bgOverlayDarkness ?? 0.4}
              onChange={(e) => onPatch({ bgOverlayDarkness: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Background image crop / resize / fit editor */}
      <BackgroundImageEditor
        open={!!bgEditorImage}
        imageUrl={bgEditorImage || ''}
        isAppLight={isAppLight}
        ratios={[
          { id: '16:9', label: '16:9', value: 16 / 9, hint: 'Slide' },
          { id: '4:3', label: '4:3', value: 4 / 3, hint: 'Classic' },
          { id: '1:1', label: '1:1', value: 1, hint: 'Square' },
          { id: '9:16', label: '9:16', value: 9 / 16, hint: 'Story' },
        ]}
        defaultRatioId="16:9"
        onClose={() => setBgEditorImage(null)}
        onApply={handleBgEditorApply}
      />
    </div>
  );
};
