const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log('[Chores]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[Chores]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn('[Chores]', ...args);
  },
};

