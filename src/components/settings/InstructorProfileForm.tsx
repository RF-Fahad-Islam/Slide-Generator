import React from 'react';
import { User, Upload } from 'lucide-react';

interface InstructorProfileFormProps {
  watermarkHandle?: string;
  watermarkAvatar?: string;
  footerTag?: string;
  onWatermarkHandleChange: (val: string) => void;
  onWatermarkAvatarChange: (val: string) => void;
  onFooterTagChange: (val: string) => void;
  isAppLight?: boolean;
}

export const InstructorProfileForm: React.FC<InstructorProfileFormProps> = ({
  watermarkHandle = '',
  watermarkAvatar = '',
  footerTag = '',
  onWatermarkHandleChange,
  onWatermarkAvatarChange,
  onFooterTagChange,
  isAppLight = false,
}) => {
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          onWatermarkAvatarChange(evt.target.result as string);
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
        <User className="w-4 h-4 text-amber-400" />
        Instructor Profile & Watermark
      </label>

      {/* Avatar Image Upload & Handle */}
      <div className="flex items-center gap-4">
        {watermarkAvatar ? (
          <div className="relative group">
            <img
              src={watermarkAvatar}
              alt="Instructor Avatar"
              className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 shadow-md"
            />
            <button
              type="button"
              onClick={() => onWatermarkAvatarChange('')}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center hover:bg-rose-600 cursor-pointer"
              title="Remove Avatar"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            className={`w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center shrink-0 ${
              isAppLight ? 'bg-slate-100 border-slate-300 text-slate-500' : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}
          >
            <User className="w-6 h-6" />
          </div>
        )}

        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={watermarkAvatar}
              onChange={(e) => onWatermarkAvatarChange(e.target.value)}
              placeholder="Instructor Avatar Image URL"
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
              Upload
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      <div>
        <label className={`block text-sm mb-1 font-semibold ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Instructor Name / Watermark Handle:
        </label>
        <input
          type="text"
          value={watermarkHandle}
          onChange={(e) => onWatermarkHandleChange(e.target.value)}
          placeholder="e.g. Hasnat Shuvro"
          className={`w-full border rounded-xl px-4 py-2.5 text-sm font-bold ${
            isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}
        />
      </div>

      <div>
        <label className={`block text-sm mb-1 font-semibold ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Footer Brand Tag (Bottom Right Watermark):
        </label>
        <input
          type="text"
          value={footerTag}
          onChange={(e) => onFooterTagChange(e.target.value)}
          placeholder="e.g. BIOMISSION"
          className={`w-full border rounded-xl px-4 py-2.5 text-sm font-mono font-bold uppercase tracking-wider ${
            isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}
        />
      </div>
    </div>
  );
};
