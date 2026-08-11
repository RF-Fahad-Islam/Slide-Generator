import React, { useEffect, useState } from 'react';
import { db } from '../../db/dexie';
import { Workspace } from '../../types';
import { createWorkspace, deleteWorkspace, renameWorkspace } from '../../utils/workspaceStore';
import { WorkspaceCard } from './WorkspaceCard';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { FolderKanban, Plus } from 'lucide-react';

interface WorkspacesHomeProps {
  appTheme: 'dark' | 'light';
  onOpenWorkspace: (id: string) => void;
}

export const WorkspacesHome: React.FC<WorkspacesHomeProps> = ({ appTheme, onOpenWorkspace }) => {
  const isAppLight = appTheme === 'light';
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadWorkspaces = async () => {
    const rows = await db.workspaces.orderBy('updatedAt').reverse().toArray();
    setWorkspaces(rows);
    setIsLoaded(true);
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const handleCreate = async (name: string, description: string | undefined, defaultTags: Workspace['defaultTags']) => {
    const workspace = await createWorkspace(name, description, defaultTags);
    setIsCreateOpen(false);
    onOpenWorkspace(workspace.id);
  };

  const handleRename = async (id: string, name: string) => {
    await renameWorkspace(id, name);
    loadWorkspaces();
  };

  const handleDelete = async (id: string) => {
    await deleteWorkspace(id);
    loadWorkspaces();
  };

  if (!isLoaded) return null;

  if (workspaces.length === 0) {
    return (
      <div className={`rounded-3xl border p-8 lg:p-12 ${isAppLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
        <div className="max-w-md mx-auto text-center space-y-5 py-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center mx-auto">
            <FolderKanban className="w-8 h-8 text-slate-950" />
          </div>
          <div>
            <h2 className={`text-xl font-black ${isAppLight ? 'text-slate-900' : 'text-white'}`}>Create your first workspace</h2>
            <p className={`text-sm mt-2 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              A workspace keeps its own paste queue, default tags, and approved-question history — e.g. one for SSC Biology, another for HSC Math.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Workspace</span>
          </button>
        </div>

        {isCreateOpen && (
          <CreateWorkspaceModal isAppLight={isAppLight} onClose={() => setIsCreateOpen(false)} onCreate={handleCreate} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-lg font-extrabold flex items-center gap-2 ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
            <FolderKanban className="w-5 h-5 text-amber-500" />
            <span>MCQ Import Workspaces</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold">
              {workspaces.length}
            </span>
          </h2>
          <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Paste, review, and approve questions per project — each workspace keeps its own history.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Workspace</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces.map((ws) => (
          <WorkspaceCard
            key={ws.id}
            workspace={ws}
            isAppLight={isAppLight}
            onOpen={() => onOpenWorkspace(ws.id)}
            onRename={(name) => handleRename(ws.id, name)}
            onDelete={() => handleDelete(ws.id)}
          />
        ))}
      </div>

      {isCreateOpen && (
        <CreateWorkspaceModal isAppLight={isAppLight} onClose={() => setIsCreateOpen(false)} onCreate={handleCreate} />
      )}
    </div>
  );
};
