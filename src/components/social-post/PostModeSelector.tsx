import React, { useState } from 'react';
import { Sparkles, ChevronDown, X, LayoutTemplate, Smile, Layers } from 'lucide-react';

export type SocialPostMode = 'classic' | 'quiz_time' | 'custom';

interface PostModeSelectorProps {
  mode: SocialPostMode;
  isAppLight: boolean;
  onSelect: (mode: SocialPostMode) => void;
}

const MODE_OPTIONS: { id: SocialPostMode; label: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'classic', label: 'Classic Quiz Card', desc: 'Brand header · stem · option grid', icon: LayoutTemplate },
  { id: 'quiz_time', label: 'Quiz Time Reactions', desc: '2×2 emoji-reaction answer grid', icon: Smile },
  { id: 'custom', label: 'Free-Form Drag & Drop', desc: 'Layers · text boxes · custom images', icon: Layers },
];

const ClassicCardMock: React.FC = () => (
  <div className="relative w-full h-full overflow-hidden rounded-lg bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 border border-white/10">
    <div className="absolute inset-0 p-2 flex flex-col justify-between">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-md bg-amber-500 shadow" />
        <div className="space-y-0.5">
          <div className="h-1 w-9 rounded-full bg-white/50" />
          <div className="h-0.5 w-6 rounded-full bg-amber-400/70" />
        </div>
      </div>
      <div className="space-y-1 pl-0.5">
        <div className="h-1.5 w-4/5 rounded-full bg-white/40" />
        <div className="h-1.5 w-3/5 rounded-full bg-white/25" />
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div className="h-3.5 rounded-md bg-white/10 border border-white/20" />
        <div className="h-3.5 rounded-md bg-amber-500 border border-amber-300 shadow" />
        <div className="h-3.5 rounded-md bg-white/10 border border-white/20" />
        <div className="h-3.5 rounded-md bg-white/10 border border-white/20" />
      </div>
    </div>
  </div>
);

const QuizTimeMock: React.FC = () => (
  <div className="relative w-full h-full overflow-hidden rounded-lg bg-gradient-to-br from-[#0b1130] via-[#141b45] to-[#1c1454] border border-white/10 p-2 flex flex-col justify-between">
    <div className="text-center">
      <div className="mx-auto h-1 w-10 rounded-full bg-amber-400" />
    </div>
    <div className="space-y-1 pl-0.5">
      <div className="h-1.5 w-4/5 rounded-full bg-white/35" />
      <div className="h-1.5 w-3/5 rounded-full bg-white/20" />
    </div>
    <div className="grid grid-cols-2 gap-1">
      {[
        { bg: 'bg-blue-500', emoji: '👍' },
        { bg: 'bg-rose-500', emoji: '❤️' },
        { bg: 'bg-orange-500', emoji: '🤗' },
        { bg: 'bg-yellow-400', emoji: '😂' },
      ].map(c => (
        <div key={c.emoji} className={`h-5 rounded-md ${c.bg} flex items-center justify-center text-[9px] shadow`}>
          {c.emoji}
        </div>
      ))}
    </div>
  </div>
);

const FreeFormMock: React.FC = () => (
  <div className="relative w-full h-full overflow-hidden rounded-lg bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10">
    <div className="absolute left-2.5 top-2 w-10 h-4 rounded-md border-2 border-dashed border-white/30" />
    <div className="absolute right-2.5 top-1/3 w-11 h-6 rounded-md border-2 border-dashed border-white/40" />
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-16 rounded-md border-2 border-dashed border-amber-400/80" />
    <div className="absolute left-2.5 bottom-2 w-12 h-3 rounded-md border-2 border-dashed border-white/30" />
  </div>
);

const MOCKUPS: Record<SocialPostMode, React.FC> = {
  classic: ClassicCardMock,
  quiz_time: QuizTimeMock,
  custom: FreeFormMock,
};

export const PostModeSelector: React.FC<PostModeSelectorProps> = ({ mode, isAppLight, onSelect }) => {
  const [open, setOpen] = useState(false);
  const active = MODE_OPTIONS.find(o => o.id === mode) || MODE_OPTIONS[0];
  const ActiveIcon = active.icon;

  const choose = (id: SocialPostMode) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <>
      {/* Compact selector bar */}
      <div
        className={`p-2 rounded-2xl border ${
          isAppLight ? 'bg-white/80 border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800 shadow-xl'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className={`w-full flex items-center justify-between gap-3 cursor-pointer rounded-xl px-2 py-1.5 transition-colors ${
            isAppLight ? 'hover:bg-slate-100/70' : 'hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500 shrink-0">
              <ActiveIcon className="w-4 h-4" />
            </span>
            <span className={`text-xs font-black uppercase tracking-wider ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Social Post Mode
            </span>
            <span
              className={`hidden sm:inline-block truncate text-[11px] font-black px-2.5 py-1 rounded-lg border ${
                isAppLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              {active.label}
            </span>
          </div>
          <span className={`p-1 rounded-lg shrink-0 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <ChevronDown className="w-4 h-4" />
          </span>
        </button>
      </div>

      {/* Mode picker modal */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Choose social post mode"
        >
          <div
            className={`absolute inset-0 ${isAppLight ? 'bg-black/40' : 'bg-black/80'} backdrop-blur-sm`}
            onClick={() => setOpen(false)}
          />
          <div
            className={`relative w-full max-w-2xl border rounded-3xl p-6 shadow-2xl ${
              isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-lg shadow-amber-500/25">
                  <Sparkles className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className={`text-sm font-black uppercase tracking-wider ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                    Choose Post Mode
                  </h3>
                  <p className={`text-[11px] ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Pick how you want to design this social post
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                  isAppLight ? 'bg-slate-100 text-slate-500 hover:text-slate-900 border-slate-200' : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
                }`}
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {MODE_OPTIONS.map(opt => {
                const Mock = MOCKUPS[opt.id];
                const isActive = mode === opt.id;
                const OptIcon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => choose(opt.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer group ${
                      isActive
                        ? isAppLight
                          ? 'bg-amber-50 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                          : 'bg-amber-500/10 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                        : isAppLight
                        ? 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
                    }`}
                  >
                    <div className="aspect-[4/3] w-full mb-2.5 overflow-hidden rounded-lg">
                      <Mock />
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-black ${
                      isActive ? (isAppLight ? 'text-slate-900' : 'text-amber-300') : isAppLight ? 'text-slate-800' : 'text-slate-100'
                    }`}>
                      <OptIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{opt.label}</span>
                    </span>
                    <span className={`block text-[10px] leading-snug mt-1 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
