import React, { useRef, useState } from 'react';
import { DeckConfig, Workspace } from '../../types';
import { loadGlobalDefaults, createDefaultDeckConfig } from '../../utils/globalDefaults';
import { useTagMemory } from '../../hooks/useTagMemory';
import { TagChipSelect } from '../TagChipSelect';
import { Presentation, X } from 'lucide-react';

interface CreateDeckFromApprovedModalProps {
  workspace: Workspace;
  count: number;
  isAppLight: boolean;
  onClose: () => void;
  onConfirm: (overrides: Partial<DeckConfig>) => void;
}

// Builds a new presentation deck from the selected approved questions. Every
// text field is pre-filled from the workspace's bound data (name + defaultTags)
// and the app's global defaults, so the user only edits what differs.
export const CreateDeckFromApprovedModal: React.FC<CreateDeckFromApprovedModalProps> = ({
  workspace,
  count,
  isAppLight,
  onClose,
  onConfirm,
}) => {
  const [name, setName] = useState(workspace.name);
  const [subject, setSubject] = useState(workspace.defaultTags?.subject || '');
  const [className, setClassName] = useState(workspace.defaultTags?.className || '');
  const [chapter, setChapter] = useState('');
  const [brandName, setBrandName] = useState(() => loadGlobalDefaults().brandName || '');
  const [headerTitle, setHeaderTitle] = useState(() => createDefaultDeckConfig({}).headerTitle);
  const [footerTag, setFooterTag] = useState(() => loadGlobalDefaults().footerTag || '');
  const [watermarkHandle, setWatermarkHandle] = useState(() => loadGlobalDefaults().watermarkHandle || '');
  const [badgeTag, setBadgeTag] = useState(() => {
    const composed = [workspace.defaultTags?.className, workspace.defaultTags?.subject].filter(Boolean).join(' | ');
    return composed || loadGlobalDefaults().badgeTag || '';
  });
  // Auto-fill helpers — the badge recomposes from class|subject and the header
  // from the chapter, but only until the user edits those fields themselves.
  const badgeEdited = useRef(false);
  const headerEdited = useRef(false);

  const { memory } = useTagMemory();

  const canSubmit = name.trim().length > 0;

  const handleSubjectChange = (v: string) => {
    setSubject(v);
    if (!badgeEdited.current) setBadgeTag([className, v].filter(Boolean).join(' | ') || loadGlobalDefaults().badgeTag || '');
  };

  const handleClassChange = (v: string) => {
    setClassName(v);
    if (!badgeEdited.current) setBadgeTag([v, subject].filter(Boolean).join(' | ') || loadGlobalDefaults().badgeTag || '');
  };

  const handleBadgeChange = (v: string) => {
    badgeEdited.current = true;
    setBadgeTag(v);
  };

  const handleChapterChange = (v: string) => {
    setChapter(v);
    if (!headerEdited.current) {
      const trimmed = v.trim();
      setHeaderTitle(trimmed ? (trimmed.startsWith('অধ্যায়') ? trimmed : `অধ্যায় ${trimmed}`) : createDefaultDeckConfig({}).headerTitle);
    }
  };

  const handleHeaderChange = (v: string) => {
    headerEdited.current = true;
    setHeaderTitle(v);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const overrides: Partial<DeckConfig> = {
      deckName: name.trim(),
      chapterName: chapter.trim() || undefined,
      headerTitle: headerTitle.trim() || undefined,
      brandName: brandName.trim() || undefined,
      badgeTag: badgeTag.trim() || undefined,
      footerTag: footerTag.trim() || undefined,
      watermarkHandle: watermarkHandle.trim() || undefined,
    };
    onConfirm(overrides);
  };

  const inputCls = `w-full px-4 py-2.5 rounded-xl border outline-none text-sm font-medium ${
    isAppLight
      ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-400'
      : 'bg-slate-900 border-slate-700 text-white focus:border-amber-500'
  }`;

  const labelCls = `block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`;

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm ${isAppLight ? 'bg-black/40' : 'bg-black/80'}`}>
      <div
        className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col ${
          isAppLight ? 'bg-white border border-slate-200' : 'bg-slate-950 border border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center">
              <Presentation className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className={`text-base font-black ${isAppLight ? 'text-slate-900' : 'text-white'}`}>New Presentation Deck</h2>
              <p className={`text-[11px] mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {count} approved question{count === 1 ? '' : 's'} · auto-filled from “{workspace.name}”
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg cursor-pointer ${isAppLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>
                Deck Name <span className="text-rose-500">*</span>
              </label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="e.g. SSC Biology Ch 8 — Approved MCQs"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Subject</label>
              <TagChipSelect value={subject} onChange={handleSubjectChange} suggestions={memory.subjects} placeholder="e.g. Biology" theme={isAppLight ? 'light' : 'dark'} />
            </div>
            <div>
              <label className={labelCls}>Class</label>
              <TagChipSelect value={className} onChange={handleClassChange} suggestions={memory.classes} placeholder="e.g. SSC" theme={isAppLight ? 'light' : 'dark'} />
            </div>

            <div>
              <label className={labelCls}>Chapter (optional)</label>
              <input
                value={chapter}
                onChange={(e) => handleChapterChange(e.target.value)}
                placeholder="e.g. ৮"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Badge Tag</label>
              <input
                value={badgeTag}
                onChange={(e) => handleBadgeChange(e.target.value)}
                placeholder="e.g. SSC | Biology"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Brand Name</label>
              <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g. NOBEL'S CLASSROOM" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Header Title</label>
              <input value={headerTitle} onChange={(e) => handleHeaderChange(e.target.value)} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Footer Tag</label>
              <input value={footerTag} onChange={(e) => setFooterTag(e.target.value)} placeholder="e.g. BIOMISSION" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Watermark Handle</label>
              <input value={watermarkHandle} onChange={(e) => setWatermarkHandle(e.target.value)} placeholder="e.g. Hasnat Shuvro" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t shrink-0">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-2xl text-sm font-bold border cursor-pointer ${
              isAppLight ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 cursor-pointer transition-all"
          >
            Create Deck ({count}) →
          </button>
        </div>
      </div>
    </div>
  );
};
