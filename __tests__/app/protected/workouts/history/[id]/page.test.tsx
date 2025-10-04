import { describe, it, expect, vi, Mock } from 'vitest';
import { render, screen, fireEvent } from '@/__tests__/utils';
import WorkoutDetailPage from '@/app/(protected)/workouts/history/[id]/page';
import { useSession } from '@/lib/api/hooks/useWorkoutSession';
import { MOCK_SESSION_WITH_SETS } from '@/__tests__/mocks/workout';

// Mock the useSession hook
vi.mock('@/lib/api/hooks/useWorkoutSession', () => ({
  useSession: vi.fn(),
}));

describe('WorkoutDetailPage', () => {
  it('should toggle exercise sets visibility when header is clicked', () => {
    // Arrange
    (useSession as Mock).mockReturnValue({
      data: MOCK_SESSION_WITH_SETS,
      isLoading: false,
      isError: false,
    });

    render(<WorkoutDetailPage params={{ id: 'test-session-id' }} />);

    const exerciseHeaders = screen.getAllByRole('button', { name: /Exercise 1/i });
    const firstExerciseHeader = exerciseHeaders[0];

    // Initially, sets should be visible
    expect(screen.getAllByText(/Set \d+/).length).toBeGreaterThan(0);

    // Act: Click to collapse
    fireEvent.click(firstExerciseHeader);

    // Assert: Sets should be hidden
    expect(screen.queryAllByText(/Set \d+/).length).toBe(0);

    // Act: Click to expand
    fireEvent.click(firstExerciseHeader);

    // Assert: Sets should be visible again
    expect(screen.getAllByText(/Set \d+/).length).toBeGreaterThan(0);
  });
});
