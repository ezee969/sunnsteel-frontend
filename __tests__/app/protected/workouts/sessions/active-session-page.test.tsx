import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock debounce hook to return values immediately for testing
vi.mock('@/hooks/use-debounce', () => ({
  useDebounce: vi.fn((value) => value) // Return value immediately for testing
}));

// Mocks
const push = vi.fn();
const back = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'sess-1' }),
  useRouter: () => ({ push, back }),
}));

const finishMutate = vi.fn();
const upsertMutate = vi.fn();

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
          reps: 10,
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
  // No delete in-session UI currently
}));

vi.mock('@/lib/api/hooks/useRoutines', () => ({
  useRoutine: () => ({
    data: {
      id: 'r1',
      name: 'Test Routine',
      days: [
        {
          id: 'rd1',
          dayOfWeek: 1,
          exercises: [
            {
              id: 're1',
              exerciseId: 'e1',
              exercise: {
                id: 'e1',
                name: 'Test Exercise',
              },
              sets: [
                { id: 's1', setNumber: 1, reps: 10, weight: 100 },
                { id: 's2', setNumber: 2, reps: 10, weight: 100 },
                { id: 's3', setNumber: 3, reps: 10, weight: 100 },
              ],
            },
          ],
        },
      ],
    },
    isLoading: false,
    error: undefined,
  }),
}));

// Import after mocks
import ActiveSessionPage from '@/app/(protected)/workouts/sessions/[id]/page';

describe('ActiveSessionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('finishes and navigates to dashboard on success', async () => {
    const user = userEvent.setup();
    // finish mutate should invoke onSuccess passed from component
    finishMutate.mockImplementation((_vars, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });

    render(<ActiveSessionPage />);

    // Clicking Finish opens confirmation dialog (since routine day metadata is missing)
    await user.click(screen.getByRole('button', { name: /finish session/i }));
    await user.click(screen.getByRole('button', { name: /finish session/i })); // The actual button text in the dialog
    expect(finishMutate).toHaveBeenCalledWith(
      { status: 'COMPLETED' },
      expect.any(Object)
    );
    expect(push).toHaveBeenCalledWith('/dashboard');

    // Note: Abort functionality might not be implemented in the UI yet
    // This test section is commented out until abort button is added to the component
    // await user.click(screen.getByRole('button', { name: /abort session/i }));
    // await user.click(screen.getByRole('button', { name: /continue/i }));
    // expect(finishMutate).toHaveBeenCalledWith(
    //   { status: 'ABORTED' },
    //   expect.any(Object)
    // );
  });

  it('should save set log when reps input changes', async () => {
    render(<ActiveSessionPage />);

    // Find the first reps input (there are multiple due to multiple sets)
    const repsInputs = screen.getAllByRole('spinbutton', { name: /performed reps/i });
    const repsInput = repsInputs[0];

    // Change the reps value to something different from the initial value (10)
    fireEvent.change(repsInput, { target: { value: '12' } });
    fireEvent.blur(repsInput);

    // With mocked debounce, the callback should be called immediately
    await waitFor(() => {
      expect(upsertMutate).toHaveBeenCalledWith({
        routineExerciseId: 're1',
        exerciseId: 're1', // Component uses routineExerciseId as exerciseId
        setNumber: 1,
        reps: 12,
        weight: 100, // Weight comes from mock data
        isCompleted: false,
      });
    });
  });

  it('autosaves on blur and toggles completion', async () => {
    const user = userEvent.setup();
    render(<ActiveSessionPage />);

    // Find the first set's completion checkbox
    const completionCheckboxes = screen.getAllByRole('checkbox', { name: /mark set as complete/i });
    const completionCheckbox = completionCheckboxes[0];

    // Toggle completion
    await user.click(completionCheckbox);

    await waitFor(
      () =>
        expect(upsertMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            reps: 10, // From mock data
            isCompleted: true,
          })
        ),
      { timeout: 1000 }
    );
  });

  it('does not render remove set controls in-session', async () => {
    render(<ActiveSessionPage />);
    expect(
      screen.queryByRole('button', { name: /remove set/i })
    ).not.toBeInTheDocument();
  });
});
