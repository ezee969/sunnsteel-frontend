import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Routine } from '@/lib/api/types/routine.type';
import type { WorkoutSession } from '@/lib/api/types/workout.type';

// Router mocks
const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

// Deterministic weekday (Monday)
vi.mock('@/lib/utils/date', () => ({
  getTodayDow: () => 1,
  weekdayName: (dow: number, fmt?: 'long' | 'short') => {
    const short = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const long = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return (fmt === 'long' ? long : short)[dow] ?? String(dow);
  },
  validateRoutineDayDate: (day: { dayOfWeek: number }) => ({
    isValid: day.dayOfWeek === 1,
    reason: day.dayOfWeek === 1 ? null : 'Not scheduled for today',
    dowMatchesToday: day.dayOfWeek === 1,
  }),
}));

// Stateful mocks
let routinesData: Routine[] | undefined;
let routinesLoading = false;
let routinesError: Error | undefined = undefined;
let activeData: WorkoutSession | undefined = undefined;
const startMutateAsync = vi.fn();

vi.mock('@/lib/api/hooks/useRoutines', () => ({
  useRoutines: () => ({ data: routinesData, isLoading: routinesLoading, error: routinesError }),
}));

vi.mock('@/lib/api/hooks/useWorkoutSession', () => ({
  useActiveSession: () => ({ data: activeData }),
  useStartSession: () => ({ mutateAsync: startMutateAsync, isPending: false }),
}));

// Import after mocks
import TodaysWorkouts from '@/app/(protected)/dashboard/components/TodaysWorkouts';

describe("Today's Workouts", () => {
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
    routinesData = undefined;
    routinesLoading = false;
    routinesError = undefined;
    activeData = undefined;
    startMutateAsync.mockReset();
  });

  it('shows loading state with weekday', () => {
    routinesLoading = true;
    render(<TodaysWorkouts />);
    expect(screen.getByText(/Fetching your plan for/i)).toBeInTheDocument();
    expect(screen.getByText(/Today’s Workouts|Today's Workouts/i)).toBeInTheDocument();
  });

  it('shows empty state with CTA when no workouts today', () => {
    routinesData = []; // no routines
    render(<TodaysWorkouts />);
    expect(screen.getByText(/No workouts scheduled today/i)).toBeInTheDocument();
    // CTA link to /routines (accessible name comes from aria-label)
    const link = screen.getByRole('link', { name: /go to routines/i });
    expect(link).toHaveAttribute('href', '/routines');
  });

  it('starts a workout and navigates to session when no active conflict', async () => {
    const user = userEvent.setup();
    routinesData = [
      makeRoutine({
        id: 'r1',
        name: 'PPL',
        days: [{ id: 'd1', dayOfWeek: 1, order: 1, exercises: [] }],
      }),
    ];
    startMutateAsync.mockResolvedValue({ id: 'sess-1' });

    render(<TodaysWorkouts />);

    await user.click(screen.getByRole('button', { name: /start workout/i }));

    await waitFor(() => {
      expect(startMutateAsync).toHaveBeenCalledWith({ routineId: 'r1', routineDayId: 'd1' });
      expect(push).toHaveBeenCalledWith('/workouts/sessions/sess-1');
    });
  });

  it('shows Resume when active session matches and navigates to it', async () => {
    const user = userEvent.setup();
    routinesData = [
      makeRoutine({ id: 'r1', name: 'PPL', days: [{ id: 'd1', dayOfWeek: 1, order: 1, exercises: [] }] }),
    ];
    activeData = makeSession({ id: 'sess-2', routineId: 'r1', routineDayId: 'd1' });

    render(<TodaysWorkouts />);

    const btn = screen.getByRole('button', { name: /resume workout/i });
    await user.click(btn);

    expect(push).toHaveBeenCalledWith('/workouts/sessions/sess-2');
    expect(startMutateAsync).not.toHaveBeenCalled();
  });

  it('shows conflict dialog when active session is for another day and navigates to it', async () => {
    const user = userEvent.setup();
    routinesData = [
      makeRoutine({ id: 'r1', name: 'PPL', days: [{ id: 'd1', dayOfWeek: 1, order: 1, exercises: [] }] }),
    ];
    activeData = makeSession({
      id: 'sess-3',
      routineId: 'r1',
      routineDayId: 'other',
      routine: { id: 'r1', name: 'X', description: null },
    });

    render(<TodaysWorkouts />);

    await user.click(screen.getByRole('button', { name: /start workout/i }));

    // Dialog
    expect(screen.getByRole('heading', { name: /active workout in progress/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /go to active session/i }));

    expect(push).toHaveBeenCalledWith('/workouts/sessions/sess-3');
    expect(startMutateAsync).not.toHaveBeenCalled();
  });
});
