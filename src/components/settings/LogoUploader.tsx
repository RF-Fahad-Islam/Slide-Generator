import React from 'react';
import { Upload, Award } from 'lucide-react';

interface LogoUploaderProps {
  logoUrl?: string;
  logoSize?: 'sm' | 'md' | 'lg' | 'xl';
  brandName?: string;
  onLogoUrlChange: (url: string) => void;
  onLogoSizeChange?: (size: 'sm' | 'md' | 'lg' | 'xl') => void;
  onBrandNameChange?: (name: string) => void;
  isAppLight?: boolean;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({
  logoUrl = '',
  logoSize = 'md',
  brandName = '',
  onLogoUrlChange,
  onLogoSizeChange,
  onBrandNameChange,
  isAppLight = false,
}) => {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          onLogoUrlChange(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className={`p-5 rounded-2xl border space-y-4 ${
        isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}
    >
      <label
        className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
          isAppLight ? 'text-amber-700' : 'text-amber-300'
        }`}
      >
        <Award className="w-4 h-4 text-amber-400" />
        Brand Logo (On Every Slide)
      </label>

      {/* Logo Upload Box */}
      <div className="flex items-center gap-4">
        {logoUrl ? (
          <div className="relative group">
            <img
              src={logoUrl}
              alt="Brand Logo Preview"
              className="w-16 h-16 object-contain rounded-2xl bg-black/40 p-1.5 border border-slate-700 shadow-md"
            />
            <button
              type="button"
              onClick={() => onLogoUrlChange('')}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white text-sm font-bold flex items-center justify-center hover:bg-rose-600 cursor-pointer"
              title="Remove Logo"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            className={`w-16 h-16 rounded-2xl border border-dashed flex items-center justify-center text-sm text-center p-2 ${
              isAppLight ? 'bg-slate-100 border-slate-300 text-slate-500' : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}
          >
            No Logo
          </div>
        )}

        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => onLogoUrlChange(e.target.value)}
              placeholder="Paste logo image URL or upload"
              className={`w-full border rounded-xl px-3 py-1.5 text-sm font-mono ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
              }`}
            />
            <label
              className={`text-sm px-3.5 py-1.5 rounded-xl border cursor-pointer flex items-center gap-1.5 font-semibold shrink-0 ${
                isAppLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Logo
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-xs text-slate-500">PNG / SVG logo with transparent background recommended.</p>
        </div>
      </div>

      {/* Logo Size Control */}
      {onLogoSizeChange && (
        <div>
          <label className={`block text-sm mb-1 font-semibold ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Logo Display Size:
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'sm', label: 'Small' },
              { id: 'md', label: 'Medium' },
              { id: 'lg', label: 'Large' },
              { id: 'xl', label: 'XL' },
            ].map((sz) => (
              <button
                key={sz.id}
                type="button"
                onClick={() => onLogoSizeChange(sz.id as any)}
                className={`py-1.5 px-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                  logoSize === sz.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : isAppLight
                    ? 'bg-white text-slate-700 border-slate-300'
                    : 'bg-slate-900 text-slate-300 border-slate-800'
                }`}
              >
                {sz.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {onBrandNameChange && (
        <div>
          <label className={`block text-sm mb-1 font-semibold ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Coaching / Brand Name:
          </label>
          <input
            type="text"
            value={brandName}
            onChange={(e) => onBrandNameChange(e.target.value)}
            placeholder="e.g. NOBEL'S CLASSROOM"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 font-bold ${
              isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          />
        </div>
      )}
    </div>
  );
};
