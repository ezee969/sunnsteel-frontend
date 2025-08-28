import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
  useRoutine: () => ({ data: undefined }),
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
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(finishMutate).toHaveBeenCalledWith(
      { status: 'COMPLETED' },
      expect.any(Object)
    );
    expect(push).toHaveBeenCalledWith('/dashboard');

    // Abort also requires confirmation
    await user.click(screen.getByRole('button', { name: /abort session/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(finishMutate).toHaveBeenCalledWith(
      { status: 'ABORTED' },
      expect.any(Object)
    );
  });

  it('autosaves on blur and toggles completion', async () => {
    render(<ActiveSessionPage />);

    // Change reps and blur (specifically the editable "Performed reps" input)
    const reps = screen.getByRole('spinbutton', {
      name: /performed reps/i,
    }) as HTMLInputElement;
    fireEvent.change(reps, { target: { value: '12' } });
    fireEvent.blur(reps);

    await waitFor(
      () =>
        expect(upsertMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            reps: 12,
            setNumber: 1,
            routineExerciseId: 're1',
            exerciseId: 'e1',
          })
        ),
      { timeout: 2000 }
    );

    // Toggle completed triggers autosave
    fireEvent.click(screen.getByRole('checkbox', { name: /mark set as complete/i }));
    await waitFor(
      () => {
        expect(upsertMutate).toHaveBeenCalledWith(
          expect.objectContaining({ isCompleted: true })
        );
      },
      { timeout: 2000 }
    );
  });

  it('does not render remove set controls in-session', async () => {
    render(<ActiveSessionPage />);
    expect(
      screen.queryByRole('button', { name: /remove set/i })
    ).not.toBeInTheDocument();
  });
});
