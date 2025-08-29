import { WorkoutSession } from '@/lib/api/types/workout.type';

export const MOCK_SESSION_WITH_SETS: WorkoutSession = {
  id: 'test-session-id',
  userId: 'user-1',
  routineId: 'routine-1',
  routineDayId: 'day-1',
  startedAt: new Date().toISOString(),
  status: 'COMPLETED',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  routineDay: {
    id: 'day-1',
    name: 'Test Day',
    order: 1,
    exercises: [
      {
        id: 're-1',
        order: 1,
        restSeconds: 120,
        progressionScheme: 'DYNAMIC',
        minWeightIncrement: 2.5,
        exercise: {
          id: 'ex-1',
          name: 'Exercise 1',
          primaryMuscle: 'CHEST',
          equipment: 'BARBELL',
        },
        sets: [
          { id: 'set-1', setNumber: 1, reps: 8, repType: 'FIXED', weight: 50 },
          { id: 'set-2', setNumber: 2, reps: 8, repType: 'FIXED', weight: 50 },
        ],
      },
    ],
  },
  setLogs: [
    {
      id: 'log-1',
      sessionId: 'test-session-id',
      routineExerciseId: 're-1',
      exerciseId: 'ex-1',
      setNumber: 1,
      reps: 8,
      weight: 50,
      isCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'log-2',
      sessionId: 'test-session-id',
      routineExerciseId: 're-1',
      exerciseId: 'ex-1',
      setNumber: 2,
      reps: 8,
      weight: 50,
      isCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};
