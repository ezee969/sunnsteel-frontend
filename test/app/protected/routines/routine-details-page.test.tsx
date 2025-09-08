import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import type { Routine } from '@/lib/api/types/routine.type';
import type { WorkoutSession } from '@/lib/api/types/workout.type';

// Router mocks (capture push)
const push = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-id' }),
  useRouter: () => ({ push }),
}));

// Date utils mock (deterministic Monday)
vi.mock('@/lib/utils/date', () => ({
  getTodayDow: () => 1, // Monday
  weekdayName: (dow: number, fmt?: 'long' | 'short') => {
    const namesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const namesLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const arr = fmt === 'long' ? namesLong : namesShort;
    return arr[dow] ?? String(dow);
  },
}));

// Hooks mocks (stateful via variables)
let routineMock: Routine | undefined = undefined;
let activeMock: WorkoutSession | undefined = undefined;
const mutateAsync = vi.fn();

vi.mock('@/lib/api/hooks/useRoutines', () => ({
  useRoutine: (_: string) => ({ data: routineMock, isLoading: false, error: undefined }),
}));

vi.mock('@/lib/api/hooks/useWorkoutSession', () => ({
  useActiveSession: () => ({ data: activeMock }),
  useStartSession: () => ({ mutateAsync, isPending: false }),
}));

// Import after mocks
import RoutineDetailsPage from '@/app/(protected)/routines/[id]/page';

describe('RoutineDetailsPage', () => {
  const makeRoutine = (overrides?: Partial<Routine>): Routine => ({
    id: 'r-default',
    userId: 'u-1',
    name: 'Default Routine',
    description: 'desc',
    isPeriodized: false,
    isFavorite: false,
    isCompleted: false,
    createdAt: '2025-02-16T00:00:00.000Z',
    updatedAt: '2025-02-16T00:00:00.000Z',
    days: [],
    ...overrides,
  });

  it('disables Start actions and shows Program ended when programEndDate is in the past', async () => {
    routineMock = makeRoutine({
      id: 'test-id',
      name: 'RtF Program',
      days: [
        { id: 'd1', dayOfWeek: 1, order: 1, exercises: [] },
      ],
      programEndDate: '2000-01-01T00:00:00.000Z',
    });

    render(<RoutineDetailsPage />);

    // Badge visible
    expect(screen.getByText(/program ended/i)).toBeInTheDocument();

    // Quick Start disabled
    const quickStart = screen.getByRole('button', { name: /quick start session/i });
    expect(quickStart).toBeDisabled();

    // Day Start disabled
    // Expand accordion first (Mon)
    await screen.findByText('Mon');
    const startDayBtn = screen.getByRole('button', { name: /start session for Mon/i });
    expect(startDayBtn).toBeDisabled();
  });

  const makeSession = (overrides?: Partial<WorkoutSession>): WorkoutSession => ({
    id: 'sess-default',
    userId: 'u-1',
    routineId: 'r-default',
    routineDayId: 'd-default',
    status: 'IN_PROGRESS',
    startedAt: '2025-02-16T00:00:00.000Z',
    endedAt: null,
    durationSec: null,
    notes: null,
    createdAt: '2025-02-16T00:00:00.000Z',
    updatedAt: '2025-02-16T00:00:00.000Z',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    routineMock = undefined;
    activeMock = undefined;
    mutateAsync.mockReset();
  });

  it('renders routine structure with days, exercises and formatted sets', () => {
    routineMock = makeRoutine({
      id: 'test-id',
      name: 'PPL',
      description: 'Push Pull Legs',
      days: [
        {
          id: 'd1',
          dayOfWeek: 1,
          order: 1,
          exercises: [
            {
              id: 're1',
              order: 1,
              restSeconds: 90,
              progressionScheme: 'NONE',
              minWeightIncrement: 2.5,
              exercise: { id: 'e1', name: 'Bench Press' },
              sets: [
                { setNumber: 1, repType: 'FIXED', reps: 8, weight: 60 },
                { setNumber: 2, repType: 'RANGE', minReps: 8, maxReps: 12 },
              ],
            },
          ],
        },
      ],
    });

    render(<RoutineDetailsPage />);

    // Title may appear in breadcrumb and header; ensure at least one instance exists
    expect(screen.getAllByText('PPL').length).toBeGreaterThan(0);
    expect(screen.getByText('Push Pull Legs')).toBeInTheDocument();
    // "Mon" appears in button and badge; ensure present
    expect(screen.getAllByText('Mon').length).toBeGreaterThan(0);
    expect(screen.getByText(/Day 1/i)).toBeInTheDocument();
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText(/Rest 90s/)).toBeInTheDocument();
    // Formatted sets
    expect(screen.getByText(/Set 1/)).toBeInTheDocument();
    expect(screen.getByText(/8 reps @ 60/)).toBeInTheDocument();
    expect(screen.getByText(/8-12 reps/)).toBeInTheDocument();
  });

  it('confirms weekday mismatch and starts when proceeding', async () => {
    const user = userEvent.setup();
    // Today = Monday (1), first day is Tuesday (2)
    routineMock = makeRoutine({
      id: 'test-id',
      name: 'PPL',
      days: [
        {
          id: 'd2',
          dayOfWeek: 2,
          order: 1,
          exercises: [],
        },
      ],
    });

    mutateAsync.mockResolvedValue({ id: 'sess-1' });

    render(<RoutineDetailsPage />);

    // Click Quick Start (first day -> Tuesday) -> mismatch dialog should appear
    await user.click(screen.getByRole('button', { name: /quick start session/i }));

    expect(
      screen.getByRole('heading', { name: /start a different day\?/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /start anyway/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ routineId: 'test-id', routineDayId: 'd2' });
      expect(push).toHaveBeenCalledWith('/workouts/sessions/sess-1');
    });
  });

  it('shows active session conflict and navigates to active session', async () => {
    const user = userEvent.setup();
    routineMock = makeRoutine({
      id: 'test-id',
      name: 'PPL',
      days: [
        { id: 'd1', dayOfWeek: 1, order: 1, exercises: [] },
      ],
    });
    activeMock = makeSession({
      id: 'sess-9',
      routineId: 'test-id',
      routineDayId: 'other-day',
      routine: { id: 'test-id', name: 'Current Session Routine', description: null },
    });

    render(<RoutineDetailsPage />);

    // Click day button (Mon)
    await user.click(screen.getByRole('button', { name: /start session for Mon/i }));

    // Dialog appears
    expect(
      screen.getByRole('heading', { name: /active workout in progress/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /go to active session/i }));

    expect(push).toHaveBeenCalledWith('/workouts/sessions/sess-9');
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
