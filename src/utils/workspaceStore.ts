import { db } from '../db/dexie';
import { MCQItem, MCQTags, Workspace } from '../types';

const dedupeById = (items: MCQItem[]): MCQItem[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

export async function createWorkspace(
  name: string,
  description?: string,
  defaultTags?: MCQTags
): Promise<Workspace> {
  const now = Date.now();
  const workspace: Workspace = {
    id: `ws_${now}`,
    name,
    description,
    defaultTags,
    reviewQueue: [],
    approvedItems: [],
    createdAt: now,
    updatedAt: now,
  };
  await db.workspaces.put(workspace);
  return workspace;
}

export async function renameWorkspace(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  await db.workspaces.update(id, { name: trimmed, updatedAt: Date.now() });
}

export async function updateWorkspaceMeta(
  id: string,
  patch: { description?: string; defaultTags?: MCQTags }
): Promise<void> {
  await db.workspaces.update(id, { ...patch, updatedAt: Date.now() });
}

// Approved questions are stored on the workspace itself — nothing is mirrored
// into a deck. Existing legacy linked decks (from before the decoupling) are left
// untouched as normal decks.
export async function deleteWorkspace(id: string): Promise<void> {
  await db.workspaces.delete(id);
}

export async function approveItems(workspace: Workspace, items: MCQItem[]): Promise<Workspace> {
  if (items.length === 0) return workspace;
  const approveIds = new Set(items.map((i) => i.id));
  const nextQueue = workspace.reviewQueue.filter((q) => !approveIds.has(q.id));
  const nextApproved = dedupeById([...workspace.approvedItems, ...items]);
  const updated: Workspace = { ...workspace, reviewQueue: nextQueue, approvedItems: nextApproved, updatedAt: Date.now() };
  await db.workspaces.put(updated);
  return updated;
}

export async function unapproveItem(workspace: Workspace, itemId: string): Promise<Workspace> {
  const item = workspace.approvedItems.find((i) => i.id === itemId);
  if (!item) return workspace;
  const nextApproved = workspace.approvedItems.filter((i) => i.id !== itemId);
  const nextQueue = dedupeById([...workspace.reviewQueue, item]);
  const updated: Workspace = { ...workspace, reviewQueue: nextQueue, approvedItems: nextApproved, updatedAt: Date.now() };
  await db.workspaces.put(updated);
  return updated;
}

export async function updateApprovedItem(workspace: Workspace, item: MCQItem): Promise<Workspace> {
  const nextApproved = workspace.approvedItems.map((i) => (i.id === item.id ? item : i));
  const updated: Workspace = { ...workspace, approvedItems: nextApproved, updatedAt: Date.now() };
  await db.workspaces.put(updated);
  return updated;
}

export async function saveReviewQueue(workspace: Workspace, reviewQueue: MCQItem[]): Promise<Workspace> {
  const updated: Workspace = { ...workspace, reviewQueue, updatedAt: Date.now() };
  await db.workspaces.put(updated);
  return updated;
}

export interface ApprovedPoolEntry {
  question: MCQItem;
  workspaceId: string;
  workspaceName: string;
}

// Aggregates every approved question across all workspaces into one deduped pool.
// This is the single source the Question Bank merges into its question list, so
// approved questions appear automatically ("auto import") without any manual step.
export async function getApprovedPool(): Promise<ApprovedPoolEntry[]> {
  const workspaces = await db.workspaces.toArray();
  const seen = new Set<string>();
  const pool: ApprovedPoolEntry[] = [];
  for (const ws of workspaces) {
    for (const question of ws.approvedItems) {
      if (seen.has(question.id)) continue;
      seen.add(question.id);
      pool.push({ question, workspaceId: ws.id, workspaceName: ws.name });
    }
  }
  return pool;
}

const DEFAULT_WORKSPACE_NAME = 'Default';

export async function getOrCreateDefaultWorkspace(): Promise<Workspace> {
  const existing = await db.workspaces.where('name').equals(DEFAULT_WORKSPACE_NAME).first();
  if (existing) return existing;
  return createWorkspace(DEFAULT_WORKSPACE_NAME, 'Auto-created workspace for questions pasted without a specific workspace open.');
}
