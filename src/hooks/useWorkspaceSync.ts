import { useCallback, useEffect, useState } from 'react';
import { db } from '../db/dexie';
import { Workspace } from '../types';

// Loads a single workspace by id and exposes a reload() so callers can
// re-fetch after workspaceStore.ts mutations commit (mirrors the
// load-then-re-fetch-after-write pattern QuestionBankView already uses for
// db.questionDecks — mutations go through the explicit store helpers, this
// hook just keeps the UI in sync with what's actually persisted).
export function useWorkspaceSync(workspaceId: string | null) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const reload = useCallback(async () => {
    if (!workspaceId) {
      setWorkspace(null);
      setIsLoaded(true);
      return;
    }
    const row = await db.workspaces.get(workspaceId);
    setWorkspace(row ?? null);
    setIsLoaded(true);
  }, [workspaceId]);

  useEffect(() => {
    setIsLoaded(false);
    reload();
  }, [reload]);

  return { workspace, isLoaded, reload };
}
