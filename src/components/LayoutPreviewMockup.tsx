import React from 'react';
import { PenTool, Sparkles, Radio, Award, BookOpen } from 'lucide-react';

interface LayoutPreviewMockupProps {
  layoutId: string;
  isLight?: boolean;
  className?: string;
}

export const LayoutPreviewMockup: React.FC<LayoutPreviewMockupProps> = ({
  layoutId,
  isLight = false,
  className = '',
}) => {
  const bgClass = isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-950/90 border-slate-800';

  if (layoutId === 'classroom_live') {
    return (
      <div className={`w-full aspect-[16/9] rounded-xl border p-2 flex flex-col justify-between overflow-hidden relative ${bgClass} ${className}`}>
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-amber-500/20">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-amber-400 text-slate-950 font-black text-[8px] flex items-center justify-center">R</div>
            <div>
              <div className="w-16 h-1 rounded bg-amber-300" />
              <div className="w-12 h-0.5 rounded bg-amber-400/70 mt-0.5" />
            </div>
          </div>
          <div className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[6px] font-bold">
            ৯ম-১০ম শ্রেণি | জীববিজ্ঞান
          </div>
        </div>

        {/* 3-Column Content Layout */}
        <div className="flex-1 my-1.5 grid grid-cols-12 gap-1.5 items-stretch">
          {/* Left Column: Stem Card & Statements */}
          <div className="col-span-5 rounded-lg p-1.5 bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded bg-amber-400 text-slate-950 text-[6px] font-black flex items-center justify-center">৩</div>
                </div>
                <div className="px-1 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-[5px] text-amber-300 flex items-center gap-0.5">
                  <Award className="w-1.5 h-1.5 text-amber-400" />
                  <span>রাজশাহী বোর্ড</span>
                </div>
              </div>
              <div className="w-full h-1 rounded bg-slate-400/70" />
              <div className="w-4/5 h-1 rounded bg-slate-400/70" />
            </div>
            <div className="p-1 rounded bg-slate-950/40 border border-white/10 space-y-0.5 mt-1">
              <div className="w-full h-1 rounded bg-amber-300/80" />
              <div className="w-3/4 h-1 rounded bg-slate-400/60" />
            </div>
          </div>

          {/* Center Column: Live Teacher Stylus Workspace */}
          <div className="col-span-4 rounded-lg p-1.5 border-2 border-dashed border-amber-400/50 bg-amber-400/5 flex flex-col items-center justify-center text-center">
            <PenTool className="w-3.5 h-3.5 text-amber-400 mb-0.5 animate-pulse" />
            <span className="text-[7px] font-black tracking-tight text-amber-300/90 uppercase leading-none">Stylus Canvas</span>
          </div>

          {/* Right Column: Options Stack */}
          <div className="col-span-3 space-y-1 flex flex-col justify-center">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-2 rounded-md bg-slate-800 border border-slate-700/80 flex items-center px-1 gap-1">
                <div className="w-1 h-1 rounded-full bg-amber-400" />
                <div className="w-full h-0.5 rounded bg-slate-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between text-[7px] font-bold text-amber-400/80 pt-0.5 border-t border-white/5">
          <span>LIVE CLASSROOM</span>
          <span>STYLUS MODE</span>
        </div>
      </div>
    );
  }

  if (layoutId === 'split_focus') {
    return (
      <div className={`w-full aspect-[16/9] rounded-xl border p-2 flex flex-col justify-between overflow-hidden relative ${bgClass} ${className}`}>
        <div className="flex items-center justify-between pb-1 border-b border-sky-500/20">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-sky-400 text-slate-950 font-black text-[8px] flex items-center justify-center">R</div>
            <div className="w-1/3 h-1.5 rounded-full bg-sky-400" />
          </div>
          <div className="w-1/4 h-1.5 rounded-full bg-sky-500/30" />
        </div>
        <div className="flex-1 my-1.5 grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2 bg-slate-800/80 border border-sky-500/30 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="w-full h-1.5 rounded bg-white" />
              <div className="w-4/5 h-1 rounded bg-slate-400" />
              <div className="w-2/3 h-1 rounded bg-slate-400" />
            </div>
            <div className="w-full h-2 rounded bg-sky-500/20 border border-sky-400/40 flex items-center px-1 justify-between">
              <span className="text-[5px] text-sky-300 font-bold">রাজশাহী বোর্ড ২০২৩</span>
            </div>
          </div>
          <div className="space-y-1 flex flex-col justify-center">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-2.5 rounded-lg bg-slate-800 border border-slate-700 flex items-center px-1.5 gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <div className="w-3/4 h-1 rounded bg-slate-300" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between text-[7px] font-bold text-sky-400 pt-0.5">
          <span>SPLIT FOCUS</span>
          <span>1-COL OPTIONS</span>
        </div>
      </div>
    );
  }

  if (layoutId === 'modern_quiz') {
    return (
      <div className={`w-full aspect-[16/9] rounded-xl border p-2 flex flex-col justify-between overflow-hidden relative ${bgClass} ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-400 text-slate-950 font-black text-[7px] flex items-center justify-center">R</div>
            <div className="w-16 h-1.5 rounded-full bg-amber-400/80" />
          </div>
          <div className="w-1/3 h-1 rounded-full bg-white/20" />
        </div>
        <div className="my-1 flex gap-1.5 items-center">
          <div className="flex-1 rounded-lg p-1.5 bg-white/5 border border-white/10 space-y-1">
            <div className="w-full h-1.5 rounded bg-white" />
            <div className="w-3/4 h-1 rounded bg-slate-400" />
          </div>
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 shrink-0 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-amber-400" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1 my-0.5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-2 rounded-md bg-white/10 border border-white/15 flex items-center px-1 gap-1">
              <div className="w-1 h-1 rounded bg-amber-400" />
              <div className="w-full h-0.5 bg-slate-200" />
            </div>
          ))}
        </div>
        <div className="w-1/3 h-1.5 rounded-full bg-amber-400/30" />
      </div>
    );
  }

  if (layoutId === 'cyber_hud') {
    return (
      <div className={`w-full aspect-[16/9] rounded-xl border p-2 flex flex-col justify-between overflow-hidden relative ${bgClass} ${className}`}>
        <div className="flex items-center justify-between">
          <div className="w-1/3 h-2 rounded-full bg-cyan-500/30 border border-cyan-400/50" />
          <div className="w-1/4 h-1 bg-cyan-400/40" />
        </div>
        <div className="my-1 flex gap-1.5 items-center">
          <div className="flex-1 rounded-lg p-1.5 bg-cyan-950/80 border border-cyan-500/40 space-y-1">
            <div className="w-full h-1.5 bg-cyan-300" />
            <div className="w-2/3 h-1 bg-cyan-500/60" />
          </div>
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 shrink-0 flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-2 rounded-full bg-cyan-500/15 border border-cyan-400/30 flex items-center px-1.5 gap-1">
              <div className="w-1 h-1 rounded-full bg-cyan-400" />
              <div className="w-full h-0.5 bg-cyan-100" />
            </div>
          ))}
        </div>
        <div className="text-[7px] font-black text-cyan-400">CYBER HUD PRESET</div>
      </div>
    );
  }

  if (layoutId === 'minimal') {
    return (
      <div className={`w-full aspect-[16/9] rounded-xl border p-2 flex flex-col justify-between overflow-hidden relative ${bgClass} ${className}`}>
        <div className="w-1/2 h-1.5 bg-emerald-400/80 rounded" />
        <div className="my-1 space-y-1 p-1">
          <div className="w-full h-2 rounded bg-white" />
          <div className="w-4/5 h-1.5 rounded bg-slate-400" />
          <div className="w-2/3 h-1.5 rounded bg-slate-400" />
        </div>
        <div className="space-y-1 my-0.5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-4/5 h-1.5 rounded bg-slate-400/60" />
          ))}
        </div>
        <div className="w-1/3 h-1 bg-emerald-400/50" />
      </div>
    );
  }

  // Enterprise 2x2 Default Layout Mockup
  return (
    <div className={`w-full aspect-[16/9] rounded-xl border p-2 flex flex-col justify-between overflow-hidden relative ${bgClass} ${className}`}>
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-1 border-b border-amber-500/20">
        <div className="flex items-center gap-1">
          <div className="w-3.5 h-3.5 rounded-md bg-amber-400 text-slate-950 font-black text-[8px] flex items-center justify-center">R</div>
          <div>
            <div className="text-[7px] font-black text-white leading-none">RAKIB'S CLASSROOM</div>
            <div className="flex items-center gap-0.5 text-[5px] text-amber-300 mt-0.5 font-bold">
              <BookOpen className="w-1.5 h-1.5 text-amber-400" />
              <span>অধ্যায় ৮ঃ রেচন প্রক্রিয়া</span>
            </div>
          </div>
        </div>
        <div className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[6px] font-bold border border-amber-500/30">
          ৯ম-১০ম শ্রেণি | জীববিজ্ঞান
        </div>
      </div>

      {/* Middle Question Card */}
      <div className="rounded-lg p-1.5 bg-slate-800/90 border border-amber-500/30 my-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-amber-400 text-slate-950 text-[6px] font-black flex items-center justify-center">৩</div>
          </div>
          <div className="px-1.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-[5px] text-amber-300 font-extrabold flex items-center gap-0.5">
            <Award className="w-1.5 h-1.5 text-amber-400" />
            <span>রাজশাহী বোর্ড ২০২৩</span>
          </div>
        </div>
        <div className="w-full h-1 rounded bg-slate-300" />
      </div>

      {/* 2x2 Options Grid */}
      <div className="grid grid-cols-2 gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-2.5 rounded-md bg-slate-800 border border-slate-700 flex items-center px-1 gap-1">
            <div className="w-1.5 h-1.5 rounded bg-amber-400 text-slate-950 font-bold text-[5px] flex items-center justify-center">
              {['ক', 'খ', 'গ', 'ঘ'][i - 1]}
            </div>
            <div className="w-full h-1 bg-slate-300" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-between text-[6px] font-bold text-amber-400 pt-0.5">
        <span>BIOMISSION</span>
        <span>Hasnat Shuvro</span>
      </div>
    </div>
  );
};
