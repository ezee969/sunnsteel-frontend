import {
  calculateSessionProgress,
  calculateExerciseCompletion,
  areAllSetsCompleted,
  groupSetLogsByExercise,
} from '@/lib/utils/session-progress.utils';
import type { SetLog } from '@/lib/api/types/workout.type';
import type { RoutineExercise } from '@/lib/api/types/routine.type';

// Mock data
const mockSetLogs: SetLog[] = [
  {
    id: '1',
    routineExerciseId: 'ex1',
    exerciseId: 'exercise1',
    setNumber: 1,
    reps: 10,
    weight: 100,
    isCompleted: true,
  },
  {
    id: '2',
    routineExerciseId: 'ex1',
    exerciseId: 'exercise1',
    setNumber: 2,
    reps: 8,
    weight: 100,
    isCompleted: false,
  },
  {
    id: '3',
    routineExerciseId: 'ex2',
    exerciseId: 'exercise2',
    setNumber: 1,
    reps: 12,
    weight: 50,
    isCompleted: true,
  },
];

const mockExercises: RoutineExercise[] = [
  {
    id: 'ex1',
    order: 1,
    exercise: {
      id: 'exercise1',
      name: 'Bench Press',
      category: 'CHEST',
      muscleGroups: ['CHEST'],
      equipment: 'BARBELL',
    },
    sets: [
      { setNumber: 1, reps: 10, weight: 100 },
      { setNumber: 2, reps: 10, weight: 100 },
    ],
  },
  {
    id: 'ex2',
    order: 2,
    exercise: {
      id: 'exercise2',
      name: 'Squats',
      category: 'LEGS',
      muscleGroups: ['QUADRICEPS'],
      equipment: 'BARBELL',
    },
    sets: [
      { setNumber: 1, reps: 12, weight: 50 },
    ],
  },
];

describe('session-progress.utils', () => {
  describe('calculateSessionProgress', () => {
    it('should calculate correct progress percentage', () => {
      const result = calculateSessionProgress(mockSetLogs, mockExercises);
      
      expect(result.completedSets).toBe(2);
      expect(result.totalSets).toBe(3);
      expect(result.percentage).toBe(67); // 2/3 * 100 rounded
    });

    it('should handle empty set logs', () => {
      const result = calculateSessionProgress([], mockExercises);
      
      expect(result.completedSets).toBe(0);
      expect(result.totalSets).toBe(3);
      expect(result.percentage).toBe(0);
    });

    it('should handle empty exercises', () => {
      const result = calculateSessionProgress(mockSetLogs, []);
      
      expect(result.completedSets).toBe(0);
      expect(result.totalSets).toBe(0);
      expect(result.percentage).toBe(0);
    });

    it('should handle 100% completion', () => {
      const allCompletedLogs = mockSetLogs.map(log => ({ ...log, isCompleted: true }));
      const result = calculateSessionProgress(allCompletedLogs, mockExercises);
      
      expect(result.completedSets).toBe(3);
      expect(result.totalSets).toBe(3);
      expect(result.percentage).toBe(100);
    });
  });

  describe('calculateExerciseCompletion', () => {
    it('should calculate exercise completion correctly', () => {
      const result = calculateExerciseCompletion(mockSetLogs, mockExercises[0]);
      
      expect(result.completedSets).toBe(1);
      expect(result.totalSets).toBe(2);
      expect(result.percentage).toBe(50);
      expect(result.isCompleted).toBe(false);
    });

    it('should identify completed exercise', () => {
      const result = calculateExerciseCompletion(mockSetLogs, mockExercises[1]);
      
      expect(result.completedSets).toBe(1);
      expect(result.totalSets).toBe(1);
      expect(result.percentage).toBe(100);
      expect(result.isCompleted).toBe(true);
    });

    it('should handle exercise with no completed sets', () => {
      const incompleteLogs = mockSetLogs.map(log => ({ ...log, isCompleted: false }));
      const result = calculateExerciseCompletion(incompleteLogs, mockExercises[0]);
      
      expect(result.completedSets).toBe(0);
      expect(result.totalSets).toBe(2);
      expect(result.percentage).toBe(0);
      expect(result.isCompleted).toBe(false);
    });
  });

  describe('areAllSetsCompleted', () => {
    it('should return false when not all sets are completed', () => {
      const result = areAllSetsCompleted(mockSetLogs, mockExercises);
      expect(result).toBe(false);
    });

    it('should return true when all sets are completed', () => {
      const allCompletedLogs = mockSetLogs.map(log => ({ ...log, isCompleted: true }));
      const result = areAllSetsCompleted(allCompletedLogs, mockExercises);
      expect(result).toBe(true);
    });

    it('should return true for empty exercises', () => {
      const result = areAllSetsCompleted(mockSetLogs, []);
      expect(result).toBe(true);
    });

    it('should return false for empty set logs with exercises', () => {
      const result = areAllSetsCompleted([], mockExercises);
      expect(result).toBe(false);
    });
  });

  describe('groupSetLogsByExercise', () => {
    it('should group set logs by exercise correctly', () => {
      const result = groupSetLogsByExercise(mockSetLogs, mockExercises, 'session1');
      
      expect(result).toHaveLength(2);
      
      // First exercise group
      expect(result[0].exerciseId).toBe('ex1');
      expect(result[0].exerciseName).toBe('Bench Press');
      expect(result[0].sets).toHaveLength(2);
      expect(result[0].sets[0].isCompleted).toBe(true);
      expect(result[0].sets[1].isCompleted).toBe(false);
      
      // Second exercise group
      expect(result[1].exerciseId).toBe('ex2');
      expect(result[1].exerciseName).toBe('Squats');
      expect(result[1].sets).toHaveLength(1);
      expect(result[1].sets[0].isCompleted).toBe(true);
    });

    it('should handle exercises with no logs', () => {
      const result = groupSetLogsByExercise([], mockExercises, 'session1');
      
      expect(result).toHaveLength(2);
      expect(result[0].sets[0].isCompleted).toBe(false);
      expect(result[0].sets[0].reps).toBe(0);
      expect(result[1].sets[0].isCompleted).toBe(false);
      expect(result[1].sets[0].reps).toBe(0);
    });

    it('should sort exercises by order', () => {
      const unorderedExercises = [mockExercises[1], mockExercises[0]];
      const result = groupSetLogsByExercise(mockSetLogs, unorderedExercises, 'session1');
      
      expect(result[0].exerciseId).toBe('ex1'); // order: 1
      expect(result[1].exerciseId).toBe('ex2'); // order: 2
    });

    it('should include planned values from template sets', () => {
      const result = groupSetLogsByExercise(mockSetLogs, mockExercises, 'session1');
      
      expect(result[0].sets[0].plannedReps).toBe(10);
      expect(result[0].sets[0].plannedWeight).toBe(100);
      expect(result[1].sets[0].plannedReps).toBe(12);
      expect(result[1].sets[0].plannedWeight).toBe(50);
    });

    it('should include progressionScheme and programStyle when provided', () => {
      const logs: SetLog[] = [
        { id: 'l1', routineExerciseId: 're1', exerciseId: 'e1', setNumber: 1, reps: 0, isCompleted: false },
      ]
      const exs: RoutineExercise[] = [
        {
          id: 're1',
          order: 1,
          restSeconds: 90,
          progressionScheme: 'PROGRAMMED_RTF',
          minWeightIncrement: 2.5,
          programStyle: 'HYPERTROPHY',
          exercise: { id: 'e1', name: 'Bench' },
          sets: [ { setNumber: 1, reps: 8, weight: 60 } as any ],
        } as any,
      ]
      const grouped = groupSetLogsByExercise(logs, exs, 's1')
      expect(grouped[0].progressionScheme).toBe('PROGRAMMED_RTF')
      expect(grouped[0].programStyle).toBe('HYPERTROPHY')
    })

    it('should derive AMRAP index by programStyle for RtF', () => {
      const logs: SetLog[] = []
      const exs: RoutineExercise[] = [
        {
          id: 'reA',
          order: 1,
          restSeconds: 120,
          progressionScheme: 'PROGRAMMED_RTF',
          minWeightIncrement: 2.5,
          programStyle: 'STANDARD',
          exercise: { id: 'eA', name: 'Squat' },
          sets: [1,2,3,4,5].map((n) => ({ setNumber: n, reps: 5 })) as any,
        } as any,
        {
          id: 'reB',
          order: 2,
          restSeconds: 120,
          progressionScheme: 'PROGRAMMED_RTF',
          minWeightIncrement: 2.5,
          programStyle: 'HYPERTROPHY',
          exercise: { id: 'eB', name: 'Bench' },
          sets: [1,2,3,4].map((n) => ({ setNumber: n, reps: 10 })) as any,
        } as any,
      ]
      const grouped = groupSetLogsByExercise(logs, exs, 's2')
      const amrapA = grouped[0].programStyle === 'HYPERTROPHY' ? 4 : 5
      const amrapB = grouped[1].programStyle === 'HYPERTROPHY' ? 4 : 5
      expect(amrapA).toBe(5)
      expect(amrapB).toBe(4)
    })
  });
});
