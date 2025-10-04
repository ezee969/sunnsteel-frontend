import { formatTime, formatDuration, calculateDuration } from '@/lib/utils/time-format.utils';

describe('time-format.utils', () => {
  describe('formatTime', () => {
    it('should format ISO date string to time', () => {
      const isoString = '2024-01-15T14:30:00.000Z';
      const result = formatTime(isoString);
      
      // The result will depend on the local timezone, but should be in HH:MM format
      expect(result).toMatch(/^\d{1,2}:\d{2}$/);
    });

    it('should return "—" for null input', () => {
      expect(formatTime(null)).toBe('—');
    });

    it('should return "—" for undefined input', () => {
      expect(formatTime(undefined)).toBe('—');
    });

    it('should return "—" for empty string', () => {
      expect(formatTime('')).toBe('—');
    });

    it('should handle invalid date strings', () => {
      expect(formatTime('invalid-date')).toBe('Invalid Date');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds to readable duration', () => {
      expect(formatDuration(0)).toBe('0s');
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(60)).toBe('1m');
      expect(formatDuration(90)).toBe('1m 30s');
      expect(formatDuration(3600)).toBe('1h');
      expect(formatDuration(3661)).toBe('1h 1m 1s');
      expect(formatDuration(7200)).toBe('2h');
      expect(formatDuration(7290)).toBe('2h 1m 30s');
    });

    it('should handle negative durations', () => {
      expect(formatDuration(-30)).toBe('0s');
      expect(formatDuration(-3600)).toBe('0s');
    });

    it('should handle large durations', () => {
      expect(formatDuration(86400)).toBe('24h'); // 1 day
      expect(formatDuration(90061)).toBe('25h 1m 1s'); // 25 hours, 1 minute, 1 second
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration between two dates', () => {
      const start = '2024-01-15T14:00:00.000Z';
      const end = '2024-01-15T15:30:00.000Z';
      
      expect(calculateDuration(start, end)).toBe(5400); // 1.5 hours = 5400 seconds
    });

    it('should return 0 for same dates', () => {
      const date = '2024-01-15T14:00:00.000Z';
      expect(calculateDuration(date, date)).toBe(0);
    });

    it('should handle end date before start date', () => {
      const start = '2024-01-15T15:00:00.000Z';
      const end = '2024-01-15T14:00:00.000Z';
      
      expect(calculateDuration(start, end)).toBe(0);
    });

    it('should handle null/undefined dates', () => {
      const date = '2024-01-15T14:00:00.000Z';
      
      expect(calculateDuration(null, date)).toBe(0);
      expect(calculateDuration(date, null)).toBe(0);
      expect(calculateDuration(null, null)).toBe(0);
      expect(calculateDuration(undefined, date)).toBe(0);
      // When endDate is undefined, it should use current time (not return 0)
      expect(calculateDuration(date, undefined)).toBeGreaterThan(0);
    });

    it('should handle invalid date strings', () => {
      const validDate = '2024-01-15T14:00:00.000Z';
      const invalidDate = 'invalid-date';
      
      expect(calculateDuration(invalidDate, validDate)).toBe(0);
      expect(calculateDuration(validDate, invalidDate)).toBe(0);
      expect(calculateDuration(invalidDate, invalidDate)).toBe(0);
    });
  });
});
