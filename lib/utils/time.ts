/**
 * Format seconds to MM:SS format
 * @param seconds - Total seconds
 * @returns Formatted time string (e.g., "2:30")
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Parse MM:SS format to total seconds
 * @param timeStr - Time string in MM:SS format (e.g., "2:30")
 * @returns Total seconds
 */
export const parseTime = (timeStr: string): number => {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return 0;

  const mins = parseInt(parts[0]) || 0;
  const secs = parseInt(parts[1]) || 0;

  return mins * 60 + secs;
};

/**
 * Validate time string format
 * @param timeStr - Time string to validate
 * @returns True if valid MM:SS format
 */
export const isValidTimeFormat = (timeStr: string): boolean => {
  const timeRegex = /^\d{1,2}:\d{2}$/;
  if (!timeRegex.test(timeStr)) return false;

  const [mins, secs] = timeStr.split(':').map(Number);
  return mins >= 0 && secs >= 0 && secs < 60;
};

/**
 * Format seconds to human readable format
 * @param seconds - Total seconds
 * @returns Human readable string (e.g., "2 min 30 sec")
 */
export const formatTimeReadable = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins === 0) {
    return `${secs} sec`;
  }

  if (secs === 0) {
    return `${mins} min`;
  }

  return `${mins} min ${secs} sec`;
};
