export const getTodayDow = (): number => {
  // Local device weekday (0=Sun..6=Sat)
  return new Date().getDay();
};

export const weekdayName = (dayOfWeek: number, style: 'short' | 'long' = 'short'): string => {
  const short = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
  const long = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ] as const;
  const src = style === 'long' ? long : short;
  return src[dayOfWeek] ?? `Day ${dayOfWeek}`;
};

export const isTodayDow = (dayOfWeek: number): boolean => dayOfWeek === getTodayDow();

// Computes number of calendar weeks remaining including the current day,
// based on a date-only programEndDate ISO string. Returns 0 if already ended.
export const weeksRemainingFromEndDate = (programEndDateIso: string | undefined | null): number => {
  if (!programEndDateIso) return 0;
  const today = new Date();
  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(programEndDateIso);
  const endUTC = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  if (todayUTC > endUTC) return 0;
  const daysInclusive = Math.floor((endUTC - todayUTC) / (24 * 60 * 60 * 1000)) + 1;
  return Math.ceil(daysInclusive / 7);
};
