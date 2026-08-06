import React from 'react';
import { SlideTextBox, SlideTextBoxBind } from '../types';
import { SLIDE_BOX_BINDS, SLIDE_BOX_COLOR_PRESETS } from '../utils/slideTextBoxes';
import { Layers, Palette } from 'lucide-react';

interface SlideTextBoxPanelProps {
  boxes: SlideTextBox[];
  selectedId: string | null;
  appTheme: 'dark' | 'light';
  onAddBox: (bind: SlideTextBoxBind) => void;
  onUpdateBox: (id: string, patch: Partial<SlideTextBox>) => void;
  onDeleteBox: (id: string) => void;
  onDuplicateBox: (id: string) => void;
  onReset: () => void;
  onClearAll: () => void;
}

export const SlideTextBoxPanel: React.FC<SlideTextBoxPanelProps> = ({
  boxes,
  selectedId,
  appTheme,
  onAddBox,
  onUpdateBox,
  onDeleteBox,
  onDuplicateBox,
  onReset,
  onClearAll,
}) => {
  const isAppLight = appTheme === 'light';
  const selectedBox = boxes.find(b => b.id === selectedId) || null;

  return (
    <div
      className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 border space-y-4 ${
        isAppLight ? 'border-slate-200' : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      <label className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
        <Layers className="w-4 h-4" />
        Slide Text Box Editor
      </label>

      {/* Add box buttons */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        <span className={`text-sm font-extrabold block ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
          Add Text Box (auto-fills from the current slide)
        </span>
        <div className="flex flex-wrap gap-2">
          {SLIDE_BOX_BINDS.map(btn => (
            <button
              key={btn.bind}
              type="button"
              onClick={() => onAddBox(btn.bind)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer hover:scale-105 ${
                isAppLight
                  ? 'bg-white border-slate-300 text-amber-700 hover:bg-amber-50 hover:border-amber-300'
                  : 'bg-slate-900 border-slate-700 text-amber-300 hover:border-amber-500/40'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected box style panel */}
      {selectedBox && (
        <div className={`p-4 rounded-2xl border space-y-4 ${
          isAppLight ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-950 border-amber-500/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-extrabold ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}>
              Style: <span className="uppercase">{selectedBox.bind}</span> box
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDuplicateBox(selectedBox.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isAppLight ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => onDeleteBox(selectedBox.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isAppLight ? 'bg-white border-rose-300 text-rose-600 hover:bg-rose-50' : 'bg-slate-900 border-rose-500/40 text-rose-300 hover:border-rose-500'
                }`}
              >
                Delete
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Bind To:</label>
            <select
              value={selectedBox.bind}
              onChange={(e) => onUpdateBox(selectedBox.id, { bind: e.target.value as SlideTextBoxBind })}
              className={`w-full border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500 ${
                isAppLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              {SLIDE_BOX_BINDS.map(opt => (
                <option key={opt.bind} value={opt.bind}>{opt.label.replace('+ ', '')}</option>
              ))}
            </select>
          </div>

          {selectedBox.bind === 'free' && (
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Text Content:</label>
              <textarea
                value={selectedBox.text || ''}
                onChange={(e) => onUpdateBox(selectedBox.id, { text: e.target.value })}
                rows={3}
                className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                  isAppLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
          )}

          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Font Size: {selectedBox.fontSize}px
            </label>
            <input
              type="range"
              min={16}
              max={140}
              step={2}
              value={selectedBox.fontSize}
              onChange={(e) => onUpdateBox(selectedBox.id, { fontSize: parseInt(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <span className="inline-flex items-center gap-1"><Palette className="w-3.5 h-3.5" /> Text Color:</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {SLIDE_BOX_COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onUpdateBox(selectedBox.id, { color: c })}
                  className={`w-6 h-6 rounded-lg border transition-transform hover:scale-110 ${
                    selectedBox.color === c ? 'ring-2 ring-amber-400 scale-110' : ''
                  } ${c === '#000000' ? 'border-slate-500' : 'border-white/20'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={selectedBox.color}
                onChange={(e) => onUpdateBox(selectedBox.id, { color: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer border border-white/20 bg-transparent"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className={`flex items-center gap-1 p-1 rounded-xl border ${
              isAppLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
            }`}>
              {(['left', 'center', 'right'] as const).map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => onUpdateBox(selectedBox.id, { align: a })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    selectedBox.align === a ? 'bg-amber-500 text-slate-950' : isAppLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onUpdateBox(selectedBox.id, { bold: !selectedBox.bold })}
              className={`px-3.5 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                selectedBox.bold
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : isAppLight
                  ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              B
            </button>
          </div>

          <p className={`text-[10px] leading-relaxed ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
            Drag a box on the slide to move it. Use the corner handle to resize. Bound boxes update automatically when you change the selected slide.
          </p>
        </div>
      )}

      {!selectedBox && (
        <p className={`text-xs text-center py-2 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Click a box on the slide to edit its style.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onReset}
          className={`flex-1 px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
            isAppLight ? 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50' : 'bg-slate-900 border-amber-500/40 text-amber-300 hover:border-amber-500'
          }`}
        >
          Reset to Default Layout
        </button>
        <button
          type="button"
          onClick={onClearAll}
          className={`px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
            isAppLight ? 'bg-white border-rose-300 text-rose-600 hover:bg-rose-50' : 'bg-slate-900 border-rose-500/40 text-rose-300 hover:border-rose-500'
          }`}
          title="Remove all text boxes from every slide"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};
