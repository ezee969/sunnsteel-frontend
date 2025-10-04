/**
 * Formats an ISO date string to a localized time string
 * @param iso - ISO date string or null/undefined
 * @returns Formatted time string or em dash if no date provided
 */
export const formatTime = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format duration in seconds to human-readable string
 * @param seconds Duration in seconds
 * @returns Formatted duration string (e.g., "1h 30m", "45m", "2m")
 */
export const formatDuration = (seconds: number): string => {
  // Handle negative durations
  if (seconds <= 0) return '0s';
  
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    const parts = [`${hours}h`];
    if (remainingMinutes > 0) parts.push(`${remainingMinutes}m`);
    if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);
    return parts.join(' ');
  }
  
  // For minutes without hours, include seconds if present
  if (remainingSeconds > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  return `${minutes}m`;
};

/**
 * Calculate duration between two dates in seconds
 * @param startDate Start date
 * @param endDate End date (defaults to current time)
 * @returns Duration in seconds
 */
export const calculateDuration = (
  startDate: string | Date | null | undefined,
  endDate?: string | Date | null | undefined
): number => {
  // Handle null/undefined startDate
  if (!startDate) {
    return 0;
  }

  // Handle null/undefined endDate (but not when it's explicitly undefined for default)
  if (endDate === null) {
    return 0;
  }
  
  // Use current time as default if endDate is not provided
  const actualEndDate = endDate === undefined ? new Date() : endDate;
  
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof actualEndDate === 'string' ? new Date(actualEndDate) : actualEndDate;
  
  // Handle invalid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }
  
  const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
  
  // Return 0 for negative durations (end before start)
  return Math.max(0, duration);
};