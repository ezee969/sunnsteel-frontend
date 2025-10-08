/**
 * Session-related constants
 */

export const SESSION_STATUS = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  ABORTED: 'ABORTED',
} as const;

export const SESSION_ACTIONS = {
  FINISH: 'finish',
  ABORT: 'abort',
} as const;

export const DEBOUNCE_DELAYS = {
  SET_LOG_SAVE: 1500,
  SEARCH: 300,
} as const;

export const UI_MESSAGES = {
  CONFIRM_FINISH: 'Are you sure you want to finish this workout session?',
  CONFIRM_ABORT: 'Are you sure you want to abort this workout session? All progress will be lost.',
  LOADING_SESSION: 'Loading session...',
  SAVING_SET: 'Saving...',
  SESSION_FINISHED: 'Session finished successfully!',
  SESSION_ABORTED: 'Session aborted.',
  ERROR_FINISHING: 'Failed to finish session',
  ERROR_ABORTING: 'Failed to abort session',
  ERROR_SAVING_SET: 'Failed to save set log',
} as const;

export const PROGRESS_THRESHOLDS = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  COMPLETE: 100,
} as const;

export const DEFAULT_VALUES = {
  REPS: 0,
  WEIGHT: 0,
  RPE: undefined,
} as const;