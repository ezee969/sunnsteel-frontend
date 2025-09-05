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
