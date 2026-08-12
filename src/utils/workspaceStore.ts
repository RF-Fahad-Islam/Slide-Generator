import { db } from '../db/dexie';
import { DeckConfig, MCQItem, MCQTags, SavedDeck, Workspace } from '../types';
import { loadGlobalDefaults } from './globalDefaults';
import { templateToTextBoxes } from './templateToTextBoxes';

// Minimal, neutral default config for a workspace's auto-created linked deck —
// deliberately blank branding (unlike the app's sample-content default config)
// since this deck starts empty and is meant to be customized later in Deck Settings.
const createDefaultDeckConfig = (name: string): DeckConfig => {
  const globalDefaults = loadGlobalDefaults();
  const base: DeckConfig = {
    templateId: globalDefaults.defaultTemplateId,
    brandName: globalDefaults.brandName || "NOBEL'S CLASSROOM",
    logoUrl: globalDefaults.logoUrl || '',
    logoSize: globalDefaults.logoSize || 'md',
    logoPosition: globalDefaults.logoPosition || 'top-left',
    headerTitle: 'অধ্যায় ৮ঃ রেচন প্রক্রিয়া',
    badgeTag: globalDefaults.badgeTag || '৯ম-১০ম শ্রেণি | জীববিজ্ঞান',
    footerTag: 'BIOMISSION',
    watermarkAvatar: '',
    watermarkHandle: 'Hasnat Shuvro',
    aspectRatio: '16:9',
    optionsLayout: '2col',
    showAnswerInSlide: false,
    answerMode: 'hidden',
    showExplanationInSlide: false,
    questionNumberFormat: globalDefaults.defaultQuestionNumberFormat,
    bgPreset: globalDefaults.bgPreset || 'none',
    bgImageOpacity: globalDefaults.bgImageOpacity ?? 0.85,
    bgOverlayDarkness: globalDefaults.bgOverlayDarkness ?? 0.4,
    deckName: name,
  };
  return { ...base, slideTextBoxes: templateToTextBoxes(base) };
};

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
  const deckId = `deck_${now}`;
  const linkedDeck: SavedDeck = {
    id: deckId,
    name,
    description,
    subject: defaultTags?.subject,
    badgeTag: defaultTags?.className && defaultTags?.subject
      ? `${defaultTags.className} | ${defaultTags.subject}`
      : (defaultTags?.className || defaultTags?.subject || ''),
    items: [],
    config: createDefaultDeckConfig(name),
    createdAt: now,
    updatedAt: now,
  };
  await db.questionDecks.put(linkedDeck);

  const workspace: Workspace = {
    id: `ws_${now}`,
    name,
    description,
    defaultTags,
    linkedDeckId: deckId,
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
  const workspace = await db.workspaces.get(id);
  if (!workspace) return;
  await db.workspaces.update(id, { name: trimmed, updatedAt: Date.now() });
  const linkedDeck = await db.questionDecks.get(workspace.linkedDeckId);
  if (linkedDeck) {
    await db.questionDecks.update(workspace.linkedDeckId, { name: trimmed, updatedAt: Date.now() });
  }
}

export async function updateWorkspaceMeta(
  id: string,
  patch: { description?: string; defaultTags?: MCQTags }
): Promise<void> {
  await db.workspaces.update(id, { ...patch, updatedAt: Date.now() });
}

// Intentionally does NOT delete the linked SavedDeck — approved questions stay
// usable in the Question Bank even after their organizational workspace is gone.
export async function deleteWorkspace(id: string): Promise<void> {
  await db.workspaces.delete(id);
}

async function saveWorkspaceAndMirrorDeck(
  workspace: Workspace,
  linkedDeckItems: MCQItem[]
): Promise<Workspace> {
  const updated: Workspace = { ...workspace, updatedAt: Date.now() };
  await db.workspaces.put(updated);
  const linkedDeck = await db.questionDecks.get(workspace.linkedDeckId);
  if (linkedDeck) {
    await db.questionDecks.update(workspace.linkedDeckId, {
      items: linkedDeckItems,
      updatedAt: Date.now(),
    });
  }
  return updated;
}

export async function approveItems(workspace: Workspace, items: MCQItem[]): Promise<Workspace> {
  if (items.length === 0) return workspace;
  const approveIds = new Set(items.map((i) => i.id));
  const nextQueue = workspace.reviewQueue.filter((q) => !approveIds.has(q.id));
  const nextApproved = dedupeById([...workspace.approvedItems, ...items]);
  const updated: Workspace = { ...workspace, reviewQueue: nextQueue, approvedItems: nextApproved };

  const linkedDeck = await db.questionDecks.get(workspace.linkedDeckId);
  const nextDeckItems = dedupeById([...(linkedDeck?.items ?? []), ...items]);
  return saveWorkspaceAndMirrorDeck(updated, nextDeckItems);
}

export async function unapproveItem(workspace: Workspace, itemId: string): Promise<Workspace> {
  const item = workspace.approvedItems.find((i) => i.id === itemId);
  if (!item) return workspace;
  const nextApproved = workspace.approvedItems.filter((i) => i.id !== itemId);
  const nextQueue = dedupeById([...workspace.reviewQueue, item]);
  const updated: Workspace = { ...workspace, reviewQueue: nextQueue, approvedItems: nextApproved };

  const linkedDeck = await db.questionDecks.get(workspace.linkedDeckId);
  const nextDeckItems = (linkedDeck?.items ?? []).filter((i) => i.id !== itemId);
  return saveWorkspaceAndMirrorDeck(updated, nextDeckItems);
}

export async function updateApprovedItem(workspace: Workspace, item: MCQItem): Promise<Workspace> {
  const nextApproved = workspace.approvedItems.map((i) => (i.id === item.id ? item : i));
  const updated: Workspace = { ...workspace, approvedItems: nextApproved };

  const linkedDeck = await db.questionDecks.get(workspace.linkedDeckId);
  const nextDeckItems = (linkedDeck?.items ?? []).map((i) => (i.id === item.id ? item : i));
  return saveWorkspaceAndMirrorDeck(updated, nextDeckItems);
}

export async function saveReviewQueue(workspace: Workspace, reviewQueue: MCQItem[]): Promise<Workspace> {
  const updated: Workspace = { ...workspace, reviewQueue, updatedAt: Date.now() };
  await db.workspaces.put(updated);
  return updated;
}

const DEFAULT_WORKSPACE_NAME = 'Default';

export async function getOrCreateDefaultWorkspace(): Promise<Workspace> {
  const existing = await db.workspaces.where('name').equals(DEFAULT_WORKSPACE_NAME).first();
  if (existing) return existing;
  return createWorkspace(DEFAULT_WORKSPACE_NAME, 'Auto-created workspace for questions pasted without a specific workspace open.');
}
