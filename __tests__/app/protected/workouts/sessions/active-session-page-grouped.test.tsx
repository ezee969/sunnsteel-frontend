import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// spies
const push = vi.fn();
const back = vi.fn();
const finishMutate = vi.fn();
const upsertMutate = vi.fn();

// base mocks
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'sess-1' }),
  useRouter: () => ({ push, back }),
}));

vi.mock('@/lib/api/hooks/useWorkoutSession', () => ({
  markSetPending: vi.fn(),
  useSession: () => ({
    data: {
      id: 'sess-1',
      userId: 'u1',
      routineId: 'r1',
      routineDayId: 'rd1',
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      setLogs: [
        {
          id: 'l1',
          sessionId: 'sess-1',
          routineExerciseId: 're1',
          exerciseId: 'e1',
          setNumber: 1,
          reps: 8,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'l2',
          sessionId: 'sess-1',
          routineExerciseId: 're1',
          exerciseId: 'e1',
          setNumber: 2,
          reps: 8,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    },
    isLoading: false,
    error: undefined,
  }),
  useFinishSession: () => ({
    mutate: finishMutate,
    isPending: false,
  }),
  useUpsertSetLog: () => ({
    mutate: upsertMutate,
    isPending: false,
  }),
}));

vi.mock('@/lib/api/hooks/useRoutines', () => ({
  useRoutine: () => ({
    data: {
      id: 'r1',
      name: 'Routine',
      days: [
        {
          id: 'rd1',
          order: 1,
          exercises: [
            {
              id: 're1',
              order: 2,
              exercise: { id: 'e1', name: 'Bench Press' },
              sets: [
                { setNumber: 1, reps: 10, weight: 100 },
                { setNumber: 2, reps: 8, weight: 100 },
              ],
            },
          ],
        },
      ],
    },
    isLoading: false,
    isFetched: true,
    error: undefined,
  }),
}));

import ActiveSessionPage from '@/app/(protected)/workouts/sessions/[id]/page';

describe('ActiveSessionPage GroupedLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders exercise group title from routine metadata', () => {
    render(<ActiveSessionPage />);
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('saves set log with correct exercise meta (grouped)', async () => {
    render(<ActiveSessionPage />);

    const repsInputs = screen.getAllByRole('spinbutton', {
      name: /performed reps/i,
    });
    const firstReps = repsInputs[0] as HTMLInputElement;
    fireEvent.change(firstReps, { target: { value: '9' } });
    fireEvent.blur(firstReps);

    // Trigger immediate save via completion toggle (ensures payload includes updated reps and meta)
    const checkboxes = screen.getAllByRole('checkbox', { name: /mark set as complete/i });
    fireEvent.click(checkboxes[0]);

    await waitFor(
      () =>
        expect(upsertMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            routineExerciseId: 're1',
            exerciseId: 'e1', // Now correctly uses the actual exercise ID
            setNumber: 1,
            reps: 9,
            weight: 100,
            isCompleted: true,
          })
        ),
      { timeout: 2000 }
    );
  });
});
