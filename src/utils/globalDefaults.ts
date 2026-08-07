export interface GlobalDefaults {
  defaultDeckName: string;
  defaultTemplateId: string;
  defaultQuestionNumberFormat: 'bangla' | 'english' | 'q_prefix';
}

const GLOBAL_DEFAULTS_KEY = 'mcqgen.globalDefaults';

export const DEFAULT_GLOBAL_DEFAULTS: GlobalDefaults = {
  defaultDeckName: 'Untitled Deck',
  defaultTemplateId: 'nobel-dark',
  defaultQuestionNumberFormat: 'bangla',
};

export const loadGlobalDefaults = (): GlobalDefaults => {
  try {
    const raw = localStorage.getItem(GLOBAL_DEFAULTS_KEY);
    if (!raw) return DEFAULT_GLOBAL_DEFAULTS;
    return { ...DEFAULT_GLOBAL_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GLOBAL_DEFAULTS;
  }
};

export const saveGlobalDefaults = (defaults: GlobalDefaults): void => {
  try {
    localStorage.setItem(GLOBAL_DEFAULTS_KEY, JSON.stringify(defaults));
  } catch {
    // localStorage unavailable — keep in-memory only
  }
};
