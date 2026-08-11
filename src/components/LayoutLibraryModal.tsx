import React from 'react';
import { SLIDE_LAYOUTS, SlideLayoutDef } from '../utils/slideElements';
import { X, LayoutGrid, Check, Sparkles, PanelTop, SquareStack, Layers, Wand2 } from 'lucide-react';

interface LayoutLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLayout: (layoutId: string) => void;
  appTheme: 'dark' | 'light';
}

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
        className={`w-full max-w-4xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {/* HEADER */}
        <div className={`p-6 border-b flex items-center justify-between ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/60'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 shadow-lg shadow-amber-500/20">
              <LayoutGrid className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Slide Layout Library</h2>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Choose from enterprise EdTech layouts, classroom mode, and multi-column option grids.
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SLIDE_LAYOUTS.map((layout) => (
              <div
                key={layout.id}
                onClick={() => {
                  onSelectLayout(layout.id);
                  onClose();
                }}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 group ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-amber-500 hover:shadow-xl'
                    : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/80 hover:bg-slate-950 hover:shadow-2xl'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <SquareStack className="w-4 h-4" />
                      </span>
                      <h3 className="text-base font-extrabold group-hover:text-amber-500 transition-colors">
                        {layout.name}
                      </h3>
                    </div>
                    {layout.id === 'enterprise_2col_grid' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Default
                      </span>
                    )}
                  </div>
                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {layout.desc}
                  </p>
                </div>

                <div className={`pt-3 border-t flex items-center justify-between text-xs font-bold ${
                  isLight ? 'border-slate-100 text-amber-600' : 'border-slate-900 text-amber-400'
                }`}>
                  <span>Apply Layout</span>
                  <span className="group-hover:translate-x-1 transition-transform">Apply →</span>
                </div>
              </div>
            ))}
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
