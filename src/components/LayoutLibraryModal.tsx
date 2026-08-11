import React from 'react';
import { SLIDE_LAYOUTS, SlideLayoutDef } from '../utils/slideElements';
import { X, LayoutGrid, Check, Sparkles, PanelTop, SquareStack, Layers, PenTool, Radio } from 'lucide-react';

interface LayoutLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLayout: (layoutId: string) => void;
  appTheme: 'dark' | 'light';
}

const LayoutPreviewMockup: React.FC<{ layoutId: string; isLight: boolean }> = ({ layoutId, isLight }) => {
  const bgClass = isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900/90 border-slate-800';

  if (layoutId === 'classroom_live') {
    return (
      <div className={`w-full aspect-[16/9] rounded-xl border p-2 flex flex-col justify-between overflow-hidden relative ${bgClass}`}>
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-amber-500/20">
          <div className="w-1/3 h-1.5 rounded-full bg-amber-400/80" />
          <div className="w-1/4 h-1.5 rounded-full bg-amber-500/30" />
        </div>

        {/* 3-Column Content Layout */}
        <div className="flex-1 my-1.5 grid grid-cols-12 gap-1.5 items-stretch">
          {/* Left Column: Stem Card & Statements */}
          <div className="col-span-5 rounded-lg p-1.5 bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="w-1/2 h-1.5 rounded bg-amber-400" />
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
      <div className={`w-full aspect-[16/9] rounded-xl border p-2 flex flex-col justify-between overflow-hidden relative ${bgClass}`}>
        <div className="flex items-center justify-between pb-1 border-b border-sky-500/20">
          <div className="w-1/3 h-1.5 rounded-full bg-sky-400" />
          <div className="w-1/4 h-1.5 rounded-full bg-sky-500/30" />
        </div>
        <div className="flex-1 my-1.5 grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2 bg-slate-800/80 border border-sky-500/30 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="w-full h-1.5 rounded bg-white" />
              <div className="w-4/5 h-1 rounded bg-slate-400" />
              <div className="w-2/3 h-1 rounded bg-slate-400" />
            </div>
            <div className="w-full h-2 rounded bg-sky-500/20 border border-sky-400/40" />
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
      <div className={`w-full aspect-[16/9] rounded-xl border p-2 flex flex-col justify-between overflow-hidden relative ${bgClass}`}>
        <div className="flex items-center justify-between">
          <div className="w-1/4 h-2 rounded-full bg-amber-400/80 px-1 flex items-center" />
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
      <div className={`w-full aspect-[16/9] rounded-xl border p-2 flex flex-col justify-between overflow-hidden relative ${bgClass}`}>
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
      <div className={`w-full aspect-[16/9] rounded-xl border p-2 flex flex-col justify-between overflow-hidden relative ${bgClass}`}>
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
    <div className={`w-full aspect-[16/9] rounded-xl border p-2 flex flex-col justify-between overflow-hidden relative ${bgClass}`}>
      <div className="flex items-center justify-between pb-1 border-b border-amber-500/20">
        <div className="w-1/3 h-1.5 rounded-full bg-amber-400" />
        <div className="w-1/4 h-1.5 rounded-full bg-amber-500/30" />
      </div>
      <div className="rounded-lg p-1.5 bg-slate-800/90 border border-amber-500/30 my-1 space-y-1">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-amber-400" />
          <div className="w-3/4 h-1.5 rounded bg-white" />
        </div>
        <div className="w-full h-1 rounded bg-slate-400" />
      </div>
      <div className="grid grid-cols-2 gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-2.5 rounded-md bg-slate-800 border border-slate-700 flex items-center px-1 gap-1">
            <div className="w-1.5 h-1.5 rounded bg-amber-400" />
            <div className="w-full h-1 bg-slate-300" />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[7px] font-bold text-amber-400 pt-0.5">
        <span>ENTERPRISE 2X2</span>
        <span>DEFAULT</span>
      </div>
    </div>
  );
};

export const LayoutLibraryModal: React.FC<LayoutLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectLayout,
  appTheme,
}) => {
  if (!isOpen) return null;

  const isLight = appTheme === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-fadeIn">
      <div
        className={`w-full max-w-5xl max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {/* HEADER */}
        <div className={`p-6 border-b flex items-center justify-between ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/60'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 shadow-lg shadow-amber-500/20">
              <LayoutGrid className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">Slide Layout Library</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {SLIDE_LAYOUTS.length} Presets
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Choose from enterprise EdTech layouts, classroom mode with live stylus space, and multi-column option grids.
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

        {/* LAYOUT GRID */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SLIDE_LAYOUTS.map((layout) => {
              const isClassroom = layout.id === 'classroom_live';
              const isDefault = layout.id === 'enterprise_2col_grid';

              return (
                <div
                  key={layout.id}
                  onClick={() => {
                    onSelectLayout(layout.id);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 group hover:scale-[1.02] ${
                    isLight
                      ? 'bg-white border-slate-200 hover:border-amber-500 hover:shadow-xl'
                      : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/80 hover:bg-slate-950 hover:shadow-2xl'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header & Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-xl border ${
                          isClassroom
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {isClassroom ? <PenTool className="w-4 h-4" /> : <SquareStack className="w-4 h-4" />}
                        </span>
                        <h3 className="text-sm font-extrabold group-hover:text-amber-500 transition-colors line-clamp-1">
                          {layout.name}
                        </h3>
                      </div>
                      {isDefault && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                          Default
                        </span>
                      )}
                      {isClassroom && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0 animate-pulse">
                          Live Writing
                        </span>
                      )}
                    </div>

                    {/* Miniature SVG/CSS Layout Mockup */}
                    <LayoutPreviewMockup layoutId={layout.id} isLight={isLight} />

                    <p className={`text-xs leading-relaxed line-clamp-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {layout.desc}
                    </p>
                  </div>

                  <div className={`pt-2.5 border-t flex items-center justify-between text-xs font-bold ${
                    isLight ? 'border-slate-100 text-amber-600' : 'border-slate-900 text-amber-400'
                  }`}>
                    <span>Apply Layout</span>
                    <span className="group-hover:translate-x-1 transition-transform">Apply →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <div className={`p-4 border-t text-center text-xs ${
          isLight ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-slate-800 bg-slate-950 text-slate-400'
        }`}>
          Selecting a layout applies the text box arrangement to the deck. You can further customize individual boxes in <strong>Edit Text Boxes</strong> mode.
        </div>
      </div>
    </div>
  );
};
