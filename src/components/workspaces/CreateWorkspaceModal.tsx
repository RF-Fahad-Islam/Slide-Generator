import React, { useState } from 'react';
import { MCQTags } from '../../types';
import { useTagMemory } from '../../hooks/useTagMemory';
import { TagChipSelect } from '../TagChipSelect';
import { FolderPlus, X, ChevronDown, ChevronRight, Tag } from 'lucide-react';

interface CreateWorkspaceModalProps {
  isAppLight: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string | undefined, defaultTags: MCQTags | undefined) => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({ isAppLight, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('');
  const [paper, setPaper] = useState('');
  const { memory } = useTagMemory();

  const canSubmit = name.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const defaultTags: MCQTags | undefined =
      subject || className || paper ? { subject: subject || undefined, className: className || undefined, paper: paper || undefined } : undefined;
    onCreate(name.trim(), description.trim() || undefined, defaultTags);
  };

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm ${isAppLight ? 'bg-black/40' : 'bg-black/80'}`}>
      <div
        className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${
          isAppLight ? 'bg-white border border-slate-200' : 'bg-slate-950 border border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center">
              <FolderPlus className="w-5 h-5 text-slate-950" />
            </div>
            <h2 className={`text-base font-black ${isAppLight ? 'text-slate-900' : 'text-white'}`}>Create Workspace</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg cursor-pointer ${isAppLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g. SSC Questions"
              className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm font-medium ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-400' : 'bg-slate-900 border-slate-700 text-white focus:border-amber-500'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What kind of questions live here?"
              rows={2}
              className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm font-medium resize-none ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-400' : 'bg-slate-900 border-slate-700 text-white focus:border-amber-500'
              }`}
            />
          </div>

          <button
            type="button"
            onClick={() => setTagsExpanded((v) => !v)}
            className={`flex items-center gap-1.5 text-xs font-bold cursor-pointer ${isAppLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
          >
            {tagsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <Tag className="w-3.5 h-3.5" />
            <span>Default tags (optional)</span>
          </button>

          {tagsExpanded && (
            <div className={`p-4 rounded-2xl border space-y-3 ${isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
              <p className={`text-[11px] ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
                These are never applied automatically — you'll get an opt-in toggle to fill blank tags when you paste questions.
              </p>
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Subject</label>
                <TagChipSelect value={subject} onChange={setSubject} suggestions={memory.subjects} placeholder="e.g. Biology" theme={isAppLight ? 'light' : 'dark'} />
              </div>
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Class</label>
                <TagChipSelect value={className} onChange={setClassName} suggestions={memory.classes} placeholder="e.g. SSC" theme={isAppLight ? 'light' : 'dark'} />
              </div>
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Paper</label>
                <TagChipSelect value={paper} onChange={setPaper} suggestions={memory.papers} placeholder="e.g. 1st Paper" theme={isAppLight ? 'light' : 'dark'} />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-800/20">
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
            Create Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
