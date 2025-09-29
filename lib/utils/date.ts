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

/**
 * Checks if a program has ended based on its end date
 * @param programEndDate - Program end date ISO string
 * @returns true if program has ended, false otherwise
 */
export const isProgramEnded = (programEndDate?: string): boolean => {
  if (!programEndDate) return false;
  const today = new Date();
  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(programEndDate);
  const endUTC = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return todayUTC > endUTC;
};

/**
 * Validates if a workout can be started today based on routine's scheduled days
 * @param routineDays - Array of routine days with dayOfWeek property
 * @param todayDow - Today's day of week (0=Sun..6=Sat), defaults to current day
 * @returns Object with validation result and message
 */
export const validateWorkoutDate = (
  routineDays: Array<{ dayOfWeek: number }> | undefined,
  todayDow: number = getTodayDow()
): { isValid: boolean; message?: string; availableDays?: string[] } => {
  if (!routineDays || routineDays.length === 0) {
    return {
      isValid: false,
      message: 'No training days configured for this routine'
    };
  }

  const scheduledDays = routineDays.map(day => day.dayOfWeek);
  const isScheduledToday = scheduledDays.includes(todayDow);

  if (isScheduledToday) {
    return { isValid: true };
  }

  const availableDayNames = scheduledDays
    .sort()
    .map(dow => weekdayName(dow, 'long'));

  return {
    isValid: false,
    message: `Today is ${weekdayName(todayDow, 'long')}, but this routine is scheduled for ${availableDayNames.join(', ')}`,
    availableDays: availableDayNames
  };
};

/**
 * Checks if a specific routine day can be started today
 * @param routineDay - The specific routine day to validate
 * @param todayDow - Today's day of week (0=Sun..6=Sat), defaults to current day
 * @returns Object with validation result and message
 */
export const validateRoutineDayDate = (
  routineDay: { dayOfWeek: number } | undefined,
  todayDow: number = getTodayDow()
): { isValid: boolean; message?: string } => {
  if (!routineDay) {
    return {
      isValid: false,
      message: 'Invalid routine day'
    };
  }

  if (routineDay.dayOfWeek === todayDow) {
    return { isValid: true };
  }

  return {
    isValid: false,
    message: `Today is ${weekdayName(todayDow, 'long')}, but this workout is scheduled for ${weekdayName(routineDay.dayOfWeek, 'long')}`
  };
};
