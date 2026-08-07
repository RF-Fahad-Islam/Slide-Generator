import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Check, Move, Maximize2, Scissors, Ruler } from 'lucide-react';
import { BgImageFit } from '../types';

export interface BgRatioOption {
  id: string;
  label: string;
  value: number; // w / h
  hint?: string;
}

export interface BgImageEditorResult {
  dataUrl: string;
  fit: BgImageFit;
  ratioId: string;
  width: number;
  height: number;
}

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface BackgroundImageEditorProps {
  open: boolean;
  imageUrl: string; // original uploaded data URL
  isAppLight: boolean;
  ratios: BgRatioOption[];
  defaultRatioId?: string;
  onClose: () => void;
  onApply: (result: BgImageEditorResult) => void;
}

const MIN_CROP = 32; // min crop width in natural image px
const OUTPUT_PRESETS = [
  { id: 'original' as const, label: 'Original' },
  { id: 720, label: '720px' },
  { id: 1080, label: '1080px' },
  { id: 1920, label: '1920px' },
  { id: 4096, label: '4096px' },
];

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se';

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/** Largest centered rect of the given ratio that fits inside the image. */
function initCrop(imgW: number, imgH: number, ratio: number): CropRect {
  let w: number, h: number;
  if (imgW / imgH >= ratio) {
    h = imgH;
    w = h * ratio;
    if (w > imgW) {
      w = imgW;
      h = w / ratio;
    }
  } else {
    w = imgW;
    h = w / ratio;
    if (h > imgH) {
      h = imgH;
      w = h * ratio;
    }
  }
  return { x: (imgW - w) / 2, y: (imgH - h) / 2, w, h };
}

/** Keep the same center but match a new ratio, then clamp into the image. */
function refitCrop(crop: CropRect, imgW: number, imgH: number, ratio: number): CropRect {
  let w = crop.w;
  let h = w / ratio;
  if (h > imgH) {
    h = imgH;
    w = h * ratio;
  }
  if (w > imgW) {
    w = imgW;
    h = w / ratio;
  }
  const cx = crop.x + crop.w / 2;
  const cy = crop.y + crop.h / 2;
  let x = clamp(cx - w / 2, 0, Math.max(0, imgW - w));
  let y = clamp(cy - h / 2, 0, Math.max(0, imgH - h));
  if (w >= imgW) x = 0;
  if (h >= imgH) y = 0;
  return { x, y, w, h };
}

function clampRect(rect: CropRect, imgW: number, imgH: number, ratio: number): CropRect {
  let { x, y, w, h } = rect;
  w = clamp(w, MIN_CROP, imgW);
  h = w / ratio;
  if (h > imgH) {
    h = imgH;
    w = h * ratio;
  }
  x = clamp(x, 0, Math.max(0, imgW - w));
  y = clamp(y, 0, Math.max(0, imgH - h));
  return { x, y, w, h };
}

/** Rebuild the crop rect after a move/resize gesture. */
function applyDrag(
  rect: CropRect,
  mode: DragMode,
  startPointer: { x: number; y: number },
  pointer: { x: number; y: number },
  imgW: number,
  imgH: number,
  ratio: number
): CropRect {
  const dx = pointer.x - startPointer.x;
  const dy = pointer.y - startPointer.y;
  if (mode === 'move') {
    return clampRect(
      { x: rect.x + dx, y: rect.y + dy, w: rect.w, h: rect.h },
      imgW,
      imgH,
      ratio
    );
  }

  // Corner resize — anchor the opposite corner, keep ratio, grow toward pointer.
  let fixedX: number, fixedY: number;
  switch (mode) {
    case 'se':
      fixedX = rect.x;
      fixedY = rect.y;
      break;
    case 'sw':
      fixedX = rect.x + rect.w;
      fixedY = rect.y;
      break;
    case 'ne':
      fixedX = rect.x;
      fixedY = rect.y + rect.h;
      break;
    case 'nw':
      fixedX = rect.x + rect.w;
      fixedY = rect.y + rect.h;
      break;
  }

  let px = pointer.x;
  let py = pointer.y;
  const wFromX = Math.abs(px - fixedX);
  const hFromY = Math.abs(py - fixedY);
  let w = Math.max(wFromX, hFromY * ratio, MIN_CROP);
  let h = w / ratio;

  const signX = px >= fixedX ? 1 : -1;
  const signY = py >= fixedY ? 1 : -1;
  let x = signX === 1 ? fixedX : fixedX - w;
  let y = signY === 1 ? fixedY : fixedY - h;

  return clampRect({ x, y, w, h }, imgW, imgH, ratio);
}

export const BackgroundImageEditor: React.FC<BackgroundImageEditorProps> = ({
  open,
  imageUrl,
  isAppLight,
  ratios,
  defaultRatioId,
  onClose,
  onApply,
}) => {
  const [ratioId, setRatioId] = useState<string>(defaultRatioId || ratios[0]?.id || '');
  const [fit, setFit] = useState<BgImageFit>('cover');
  const [outPreset, setOutPreset] = useState<'original' | number>('original');
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [previewSize, setPreviewSize] = useState({ w: 0, h: 0 });

  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    mode: DragMode;
    startPointer: { x: number; y: number };
    startRect: CropRect;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const activeRatio = ratios.find((r) => r.id === ratioId) || ratios[0];

  // Load the image whenever the modal opens.
  useEffect(() => {
    if (!open || !imageUrl) return;
    const targetRatioId = defaultRatioId || ratios[0]?.id || '';
    setRatioId(targetRatioId);
    setFit('cover');
    setOutPreset('original');
    setCrop(null);
    setDragging(false);
    const el = new Image();
    el.onload = () => {
      setImg(el);
      const r = ratios.find((x) => x.id === targetRatioId) || ratios[0];
      setCrop(initCrop(el.naturalWidth, el.naturalHeight, r ? r.value : el.naturalWidth / el.naturalHeight));
    };
    el.src = imageUrl;
    return () => {
      el.onload = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, imageUrl]);

  // Measure the preview stage.
  useEffect(() => {
    if (!open || !stageRef.current) return;
    const node = stageRef.current;
    const measure = () => {
      const r = node.getBoundingClientRect();
      setPreviewSize({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [open]);

  // Reset crop when the ratio changes.
  useEffect(() => {
    if (!img || !activeRatio) return;
    setCrop((prev) =>
      prev ? refitCrop(prev, img.naturalWidth, img.naturalHeight, activeRatio.value) : prev
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratioId, img]);

  const toImgCoords = useCallback(
    (clientX: number, clientY: number) => {
      const node = stageRef.current;
      if (!node || !img) return { x: 0, y: 0 };
      const r = node.getBoundingClientRect();
      const scale = Math.min(previewSize.w / img.naturalWidth, previewSize.h / img.naturalHeight);
      const offX = (previewSize.w - img.naturalWidth * scale) / 2;
      const offY = (previewSize.h - img.naturalHeight * scale) / 2;
      return {
        x: (clientX - r.left - offX) / scale,
        y: (clientY - r.top - offY) / scale,
      };
    },
    [img, previewSize]
  );

  const onPointerDown = (e: React.PointerEvent, mode: DragMode) => {
    if (!img || !crop || !activeRatio) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      mode,
      startPointer: toImgCoords(e.clientX, e.clientY),
      startRect: { ...crop },
    };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || !img || !crop || !activeRatio) return;
    const p = toImgCoords(e.clientX, e.clientY);
    setCrop(
      applyDrag(d.startRect, d.mode, d.startPointer, p, img.naturalWidth, img.naturalHeight, activeRatio.value)
    );
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  if (!open) return null;

  const ratio = activeRatio ? activeRatio.value : img ? img.naturalWidth / img.naturalHeight : 1;

  // Output dimensions at the chosen preset (natural crop size for Original).
  const computeOutput = () => {
    if (!img || !crop) return { w: 0, h: 0 };
    const baseW =
      outPreset === 'original'
        ? crop.w
        : outPreset;
    return { w: Math.round(baseW), h: Math.round(baseW / ratio) };
  };

  const handleApply = () => {
    if (!img || !crop) return;
    const out = computeOutput();
    const canvas = document.createElement('canvas');
    canvas.width = out.w;
    canvas.height = out.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (fit === 'cover') {
      ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, out.w, out.h);
    } else if (fit === 'contain') {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const s = Math.min(out.w / iw, out.h / ih);
      const dw = iw * s;
      const dh = ih * s;
      ctx.drawImage(img, (out.w - dw) / 2, (out.h - dh) / 2, dw, dh);
    } else {
      ctx.drawImage(img, 0, 0, out.w, out.h);
    }
    onApply({
      dataUrl: canvas.toDataURL(fit === 'contain' ? 'image/png' : 'image/jpeg', 0.92),
      fit,
      ratioId: activeRatio?.id || 'free',
      width: out.w,
      height: out.h,
    });
  };

  // Preview geometry (image contained inside the stage).
  const scale = img
    ? Math.min(previewSize.w / img.naturalWidth, previewSize.h / img.naturalHeight)
    : 1;
  const dispW = img ? img.naturalWidth * scale : 0;
  const dispH = img ? img.naturalHeight * scale : 0;
  const offX = (previewSize.w - dispW) / 2;
  const offY = (previewSize.h - dispH) / 2;

  const box =
    img && crop
      ? {
          x: crop.x * scale + offX,
          y: crop.y * scale + offY,
          w: crop.w * scale,
          h: crop.h * scale,
        }
      : null;

  const boxCls = isAppLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800';
  const cardCls = isAppLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-900 border-slate-800 text-white';
  const btnBase = `px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Edit background image">
      <div
        className={`absolute inset-0 ${isAppLight ? 'bg-black/50' : 'bg-black/85'} backdrop-blur-sm`}
        onClick={onClose}
      />

      <div className={`relative w-full max-w-5xl border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${cardCls}`}>
        {/* Header */}
        <div className={`flex items-center justify-between gap-3 p-5 border-b ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-lg shadow-amber-500/25">
              <Scissors className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className={`text-sm font-black uppercase tracking-wider ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                Resize · Crop · Fit Background
              </h3>
              <p className={`text-[11px] ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Choose an aspect ratio, drag the crop frame, then set fit & output size.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${
              isAppLight ? 'bg-slate-100 text-slate-500 hover:text-slate-900 border-slate-200' : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
            }`}
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 p-5 overflow-y-auto">
          {/* Crop stage */}
          <div className="lg:col-span-3">
            <div
              ref={stageRef}
              className={`relative w-full h-[320px] sm:h-[400px] lg:h-[440px] rounded-2xl border overflow-hidden touch-none select-none ${
                isAppLight ? 'bg-slate-900/90 border-slate-300' : 'bg-slate-950 border-slate-800'
              }`}
              onPointerDown={(e) => onPointerDown(e, 'move')}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onPointerLeave={endDrag}
            >
              {img && (
                <>
                  <img
                    src={img.src}
                    alt="Background preview"
                    className="absolute pointer-events-none"
                    style={{
                      width: dispW,
                      height: dispH,
                      left: offX,
                      top: offY,
                      maxWidth: 'none',
                    }}
                    draggable={false}
                  />
                  {fit === 'cover' && box && (
                    <>
                      {/* Dim outside the crop box */}
                      {[
                        { left: 0, top: 0, w: previewSize.w, h: box.y },
                        { left: 0, top: box.y, w: box.x, h: box.h },
                        { left: box.x + box.w, top: box.y, w: previewSize.w - box.x - box.w, h: box.h },
                        { left: 0, top: box.y + box.h, w: previewSize.w, h: previewSize.h - box.y - box.h },
                      ].map((r, i) => (
                        <div
                          key={i}
                          className="absolute bg-black/55 pointer-events-none"
                          style={{ left: r.left, top: r.top, width: r.w, height: r.h }}
                        />
                      ))}
                      {/* Crop box */}
                      <div
                        className="absolute border-2 border-amber-400 pointer-events-none"
                        style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
                      >
                        {/* Rule-of-thirds guides */}
                        {[0.333, 0.666].map((f) => (
                          <React.Fragment key={`v${f}`}>
                            <div className="absolute bg-white/25 pointer-events-none" style={{ left: box.w * f, top: 0, width: 1, height: box.h }} />
                            <div className="absolute bg-white/25 pointer-events-none" style={{ top: box.h * f, left: 0, width: box.w, height: 1 }} />
                          </React.Fragment>
                        ))}
                        {/* Corner handles */}
                        {(['nw', 'ne', 'sw', 'se'] as DragMode[]).map((m) => {
                          const pos =
                            m === 'nw' ? { left: -6, top: -6 } :
                            m === 'ne' ? { right: -6, top: -6 } :
                            m === 'sw' ? { left: -6, bottom: -6 } :
                            { right: -6, bottom: -6 };
                          return (
                            <div
                              key={m}
                              role="button"
                              onPointerDown={(e) => onPointerDown(e, m)}
                              className={`absolute w-3 h-3 rounded-sm bg-amber-400 border border-slate-950 cursor-${m === 'nw' || m === 'se' ? 'nwse-resize' : 'nesw-resize'} pointer-events-auto`}
                              style={pos}
                            />
                          );
                        })}
                      </div>
                      <div className={`absolute bottom-2 left-2 px-2 py-1 rounded-lg font-mono text-[10px] font-bold pointer-events-none ${isAppLight ? 'bg-black/60 text-amber-300' : 'bg-black/60 text-amber-300'}`}>
                        {Math.round(crop.w)} × {Math.round(crop.h)}px
                      </div>
                    </>
                  )}
                  {fit !== 'cover' && (
                    <div className={`absolute bottom-2 left-2 px-2 py-1 rounded-lg font-mono text-[10px] font-bold pointer-events-none bg-black/60 text-amber-300`}>
                      Full image · {fit === 'contain' ? 'Contain' : 'Stretch'}
                    </div>
                  )}
                  {!img && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                      Loading image…
                    </div>
                  )}
                </>
              )}
              {dragging && box && <div className="absolute inset-0 cursor-move pointer-events-none" />}
            </div>

            {/* Crop hint */}
            <p className={`text-[11px] mt-2 flex items-center gap-1.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <Move className="w-3.5 h-3.5 text-amber-500" />
              Drag anywhere to pan · drag the corner handles to resize · frame stays locked to the aspect ratio
            </p>
          </div>

          {/* Controls */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Aspect ratio */}
            <div className={`p-4 rounded-2xl border space-y-2.5 ${boxCls}`}>
              <label className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
                <Maximize2 className="w-3.5 h-3.5" /> Aspect Ratio
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ratios.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRatioId(r.id)}
                    className={`${btnBase} ${
                      ratioId === r.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                        : isAppLight
                        ? 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50'
                    }`}
                  >
                    {r.label}
                    {r.hint && <span className="block text-[10px] font-semibold opacity-70">{r.hint}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Fit mode */}
            <div className={`p-4 rounded-2xl border space-y-2.5 ${boxCls}`}>
              <label className={`text-[11px] font-black uppercase tracking-wider ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
                Fit Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'cover', label: 'Cover', desc: 'Fill + crop' },
                    { id: 'contain', label: 'Contain', desc: 'Whole image' },
                    { id: 'stretch', label: 'Stretch', desc: 'Distort' },
                  ] as { id: BgImageFit; label: string; desc: string }[]
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFit(f.id)}
                    className={`${btnBase} ${fit === f.id ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black' : isAppLight ? 'bg-white text-slate-700 border-slate-200' : 'bg-slate-900 text-slate-300 border-slate-700'}`}
                  >
                    {f.label}
                    <span className="block text-[10px] font-semibold opacity-70">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Output size */}
            <div className={`p-4 rounded-2xl border space-y-2.5 ${boxCls}`}>
              <label className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
                <Ruler className="w-3.5 h-3.5" /> Output Size
              </label>
              <div className="flex flex-wrap gap-2">
                {OUTPUT_PRESETS.map((p) => (
                  <button
                    key={String(p.id)}
                    type="button"
                    onClick={() => setOutPreset(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      outPreset === p.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                        : isAppLight
                        ? 'bg-white text-slate-600 border-slate-200 hover:border-amber-400'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {img && crop && (
                <p className={`text-[10px] font-mono ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  → {computeOutput().w} × {computeOutput().h}px · {activeRatio?.label || 'free'}
                </p>
              )}
            </div>

            <div className="flex-1" />
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 p-5 border-t ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-3 rounded-2xl text-xs font-bold border cursor-pointer transition-all ${
              isAppLight ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!img}
            className="px-7 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer disabled:opacity-40 transition-all"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            Apply Background
          </button>
        </div>
      </div>
    </div>
  );
};
