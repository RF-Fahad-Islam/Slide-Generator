export type PostTemplateId = 'classic' | 'quiz_time';

export interface ReactionEmojiSet {
  A: string;
  B: string;
  C: string;
  D: string;
}

export const REACTION_ORDER: (keyof ReactionEmojiSet)[] = ['A', 'B', 'C', 'D'];

export const DEFAULT_REACTION_EMOJIS: ReactionEmojiSet = {
  A: '👍',
  B: '❤️',
  C: '🤗',
  D: '😂',
};

export const REACTION_BADGE_COLORS: Record<keyof ReactionEmojiSet, string> = {
  A: '#3b82f6',
  B: '#f43f5e',
  C: '#f97316',
  D: '#facc15',
};
