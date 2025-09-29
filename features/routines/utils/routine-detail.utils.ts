/**
 * Utility functions and constants for routine detail page
 */

/**
 * Gets the display name for a day of the week
 * @param dayOfWeek - Day of week number (0 = Sunday, 6 = Saturday)
 * @returns The display name of the day
 */
export const getDayName = (dayOfWeek: number): string => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[dayOfWeek] || 'Unknown';
};

/**
 * Formats progression scheme for display
 * @param progressionScheme - The progression scheme string
 * @returns Formatted display text
 */
export const formatProgressionScheme = (progressionScheme: string): string => {
  return progressionScheme.replace('_', ' ');
};

/**
 * Constants for routine detail page
 */
export const ROUTINE_DETAIL_CONSTANTS = {
  LOADING_SPINNER_SIZE: 'h-4 w-4',
  BADGE_VARIANTS: {
    SECONDARY: 'secondary' as const,
    OUTLINE: 'outline' as const,
  },
  BUTTON_SIZES: {
    SM: 'sm' as const,
  },
  ICON_SIZES: {
    SM: 'h-4 w-4',
    MD: 'h-6 w-6',
  },
} as const;