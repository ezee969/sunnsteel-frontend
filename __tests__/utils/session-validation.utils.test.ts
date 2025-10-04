import {
  validateSetLogPayload,
  isSetComplete,
  validateSessionFinish,
  validateWeight,
} from '@/lib/utils/session-validation.utils';
import type { UpsertSetLogPayload } from '@/lib/utils/workout-session.types';

describe('session-validation.utils', () => {
  describe('validateSetLogPayload', () => {
    const validPayload: UpsertSetLogPayload = {
      routineExerciseId: 'ex1',
      exerciseId: 'exercise1',
      setNumber: 1,
      reps: 10,
      weight: 100,
      isCompleted: true,
    };

    it('should validate correct payload', () => {
      const result = validateSetLogPayload(validPayload);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject missing routineExerciseId', () => {
      const payload = { ...validPayload, routineExerciseId: '' };
      const result = validateSetLogPayload(payload);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Routine exercise ID is required');
    });

    it('should reject missing exerciseId', () => {
      const payload = { ...validPayload, exerciseId: '' };
      const result = validateSetLogPayload(payload);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Exercise ID is required');
    });

    it('should reject invalid set number', () => {
      const payload = { ...validPayload, setNumber: 0 };
      const result = validateSetLogPayload(payload);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Set number must be greater than 0');
    });

    it('should reject negative reps', () => {
      const payload = { ...validPayload, reps: -1 };
      const result = validateSetLogPayload(payload);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Reps must be 0 or greater');
    });

    it('should reject negative weight', () => {
      const payload = { ...validPayload, weight: -10 };
      const result = validateSetLogPayload(payload);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Weight must be 0 or greater');
    });

    it('should allow undefined weight', () => {
      const payload = { ...validPayload, weight: undefined };
      const result = validateSetLogPayload(payload);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should collect multiple errors', () => {
      const payload: UpsertSetLogPayload = {
        routineExerciseId: '',
        exerciseId: '',
        setNumber: -1,
        reps: -5,
        weight: -10,
      };
      
      const result = validateSetLogPayload(payload);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(5);
    });
  });

  describe('isSetComplete', () => {
    it('should return true for positive reps', () => {
      expect(isSetComplete(1)).toBe(true);
      expect(isSetComplete(10)).toBe(true);
      expect(isSetComplete(100)).toBe(true);
    });

    it('should return false for zero reps', () => {
      expect(isSetComplete(0)).toBe(false);
    });

    it('should return false for negative reps', () => {
      expect(isSetComplete(-1)).toBe(false);
      expect(isSetComplete(-10)).toBe(false);
    });

    it('should return false for undefined reps', () => {
      expect(isSetComplete(undefined)).toBe(false);
    });

    it('should return false for null reps', () => {
      expect(isSetComplete(null as any)).toBe(false);
    });
  });

  describe('validateSessionFinish', () => {
    it('should validate session with all sets completed', () => {
      const result = validateSessionFinish(10, 10);
      
      expect(result.isValid).toBe(true);
      expect(result.canFinish).toBe(true);
      expect(result.warnings).toEqual([]);
    });

    it('should warn about incomplete sets but allow finishing', () => {
      const result = validateSessionFinish(5, 10);
      
      expect(result.isValid).toBe(true);
      expect(result.canFinish).toBe(true);
      expect(result.warnings).toContain('5 out of 10 sets are incomplete');
    });

    it('should handle zero completed sets', () => {
      const result = validateSessionFinish(0, 10);
      
      expect(result.isValid).toBe(true);
      expect(result.canFinish).toBe(true);
      expect(result.warnings).toContain('10 out of 10 sets are incomplete');
    });

    it('should handle sessions with no sets', () => {
      const result = validateSessionFinish(0, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.canFinish).toBe(true);
      expect(result.warnings).toEqual([]);
    });

    it('should reject invalid completed sets count', () => {
      const result = validateSessionFinish(-1, 10);
      
      expect(result.isValid).toBe(false);
      expect(result.canFinish).toBe(false);
      expect(result.warnings).toContain('Invalid session data');
    });

    it('should reject invalid total sets count', () => {
      const result = validateSessionFinish(5, -1);
      
      expect(result.isValid).toBe(false);
      expect(result.canFinish).toBe(false);
      expect(result.warnings).toContain('Invalid session data');
    });

    it('should reject completed sets greater than total', () => {
      const result = validateSessionFinish(15, 10);
      
      expect(result.isValid).toBe(false);
      expect(result.canFinish).toBe(false);
      expect(result.warnings).toContain('Invalid session data');
    });
  });

  describe('validateWeight', () => {
    it('should validate positive weights', () => {
      expect(validateWeight(1)).toBe(true);
      expect(validateWeight(100.5)).toBe(true);
      expect(validateWeight(0.25)).toBe(true);
    });

    it('should validate zero weight', () => {
      expect(validateWeight(0)).toBe(true);
    });

    it('should reject negative weights', () => {
      expect(validateWeight(-1)).toBe(false);
      expect(validateWeight(-0.1)).toBe(false);
    });

    it('should validate undefined weight', () => {
      expect(validateWeight(undefined)).toBe(true);
    });

    it('should validate null weight', () => {
      expect(validateWeight(null)).toBe(true);
    });

    it('should reject NaN weight', () => {
      expect(validateWeight(NaN)).toBe(false);
    });

    it('should reject infinite weight', () => {
      expect(validateWeight(Infinity)).toBe(false);
      expect(validateWeight(-Infinity)).toBe(false);
    });
  });
});
