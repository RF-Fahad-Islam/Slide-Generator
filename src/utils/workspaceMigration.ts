import { db } from '../db/dexie';
import { MCQItem } from '../types';
import { createWorkspace } from './workspaceStore';

const DRAFT_STORAGE_KEY = 'mcqgen.manualEditor.draft';
const MIGRATION_DONE_KEY = 'mcqgen.workspaceMigration.v1.done';

interface LegacyDraft {
  unapprovedQueue?: MCQItem[];
  resolvedIds?: string[];
  stagedItems?: MCQItem[];
}

function loadLegacyDraft(): LegacyDraft {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// One-time, idempotent migration: before Workspaces existed, the Manual Editor
// kept a single global review queue auto-saved to localStorage. Now that
// pasting/reviewing only happens inside a workspace, this seeds a "Default"
// workspace from whatever was still pending in that old draft so nothing
// pasted-but-not-yet-approved is silently lost on upgrade.
export async function migrateLegacyDraftToDefaultWorkspace(): Promise<void> {
  if (localStorage.getItem(MIGRATION_DONE_KEY)) return;

  const existingWorkspaces = await db.workspaces.count();
  if (existingWorkspaces > 0) {
    localStorage.setItem(MIGRATION_DONE_KEY, 'true');
    return;
  }

  const draft = loadLegacyDraft();
  const resolvedIds = new Set(draft.resolvedIds || []);
  // Items already marked resolved were already committed into the active deck
  // or a Question Bank deck under the old flow — re-adding them here would
  // duplicate them, so only genuinely still-pending items are carried over.
  const pendingFromQueue = (draft.unapprovedQueue || []).filter((q) => !resolvedIds.has(q.id));
  const stagedItems = draft.stagedItems || [];
  const seedQueue = [...pendingFromQueue, ...stagedItems];

  // Nothing worth carrying over (fresh install, or the old Manual Editor was
  // never used) — leave Workspaces empty so a genuinely new user sees the
  // normal "create your first workspace" empty state instead of a stray one.
  if (seedQueue.length > 0) {
    const workspace = await createWorkspace(
      'Default',
      'Auto-created from questions pending review before Workspaces existed.'
    );
    await db.workspaces.update(workspace.id, { reviewQueue: seedQueue, updatedAt: Date.now() });
  }

  localStorage.removeItem(DRAFT_STORAGE_KEY);
  localStorage.setItem(MIGRATION_DONE_KEY, 'true');
}
