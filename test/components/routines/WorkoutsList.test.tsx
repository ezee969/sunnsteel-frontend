import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorkoutsList from '@/app/(protected)/routines/components/WorkoutsList';
import { useRoutines, useToggleRoutineFavorite, useToggleRoutineCompleted } from '@/lib/api/hooks/useRoutines';
import { createQueryWrapper } from '@/test/utils';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/api/hooks/useRoutines');

const mockRoutines = [
  {
    id: '1',
    name: 'Push Day',
    description: 'Chest, shoulders, triceps',
    isFavorite: false,
    isCompleted: false,
    userId: 'user1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Pull Day',
    description: 'Back, biceps',
    isFavorite: true,
    isCompleted: false,
    userId: 'user1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Leg Day',
    description: 'Quads, hamstrings, glutes',
    isFavorite: false,
    isCompleted: true,
    userId: 'user1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockUseRoutines = {
  data: mockRoutines,
  isLoading: false,
  isError: false,
  error: null,
};

const mockToggleFavorite = jest.fn();
const mockToggleCompleted = jest.fn();

const mockUseToggleFavorite = {
  mutate: mockToggleFavorite,
  isPending: false,
};

const mockUseToggleCompleted = {
  mutate: mockToggleCompleted,
  isPending: false,
};

describe('WorkoutsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRoutines as jest.Mock).mockReturnValue(mockUseRoutines);
    (useToggleRoutineFavorite as jest.Mock).mockReturnValue(mockUseToggleFavorite);
    (useToggleRoutineCompleted as jest.Mock).mockReturnValue(mockUseToggleCompleted);
  });

  it('should render list of routines', () => {
    render(<WorkoutsList />, { wrapper: createQueryWrapper() });

    expect(screen.getByText('Push Day')).toBeInTheDocument();
    expect(screen.getByText('Pull Day')).toBeInTheDocument();
    expect(screen.getByText('Leg Day')).toBeInTheDocument();
    expect(screen.getByText('Chest, shoulders, triceps')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    (useRoutines as jest.Mock).mockReturnValue({
      ...mockUseRoutines,
      isLoading: true,
    });

    render(<WorkoutsList />, { wrapper: createQueryWrapper() });

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should show error state', () => {
    (useRoutines as jest.Mock).mockReturnValue({
      ...mockUseRoutines,
      isLoading: false,
      isError: true,
      error: { message: 'Failed to load routines' },
    });

    render(<WorkoutsList />, { wrapper: createQueryWrapper() });

    expect(screen.getByText(/failed to load routines/i)).toBeInTheDocument();
  });

  it('should show empty state when no routines', () => {
    (useRoutines as jest.Mock).mockReturnValue({
      ...mockUseRoutines,
      data: [],
    });

    render(<WorkoutsList />, { wrapper: createQueryWrapper() });

    expect(screen.getByText(/no routines found/i)).toBeInTheDocument();
  });

  it('should toggle favorite when heart button clicked', async () => {
    render(<WorkoutsList />, { wrapper: createQueryWrapper() });

    const heartButtons = screen.getAllByLabelText(/toggle favorite/i);
    fireEvent.click(heartButtons[0]); // Click on first routine (not favorited)

    await waitFor(() => {
      expect(mockToggleFavorite).toHaveBeenCalledWith({
        id: '1',
        isFavorite: true,
      });
    });
  });

  it('should toggle completed when checklist button clicked', async () => {
    render(<WorkoutsList />, { wrapper: createQueryWrapper() });

    const checklistButtons = screen.getAllByLabelText(/toggle completed/i);
    fireEvent.click(checklistButtons[0]); // Click on first routine (not completed)

    await waitFor(() => {
      expect(mockToggleCompleted).toHaveBeenCalledWith({
        id: '1',
        isCompleted: true,
      });
    });
  });

  it('should show favorite status correctly', () => {
    render(<WorkoutsList />, { wrapper: createQueryWrapper() });

    const heartButtons = screen.getAllByLabelText(/toggle favorite/i);
    
    // First routine should not be favorited (empty heart)
    expect(heartButtons[0]).toHaveAttribute('data-favorited', 'false');
    
    // Second routine should be favorited (filled heart)
    expect(heartButtons[1]).toHaveAttribute('data-favorited', 'true');
  });

  it('should show completed status correctly', () => {
    render(<WorkoutsList />, { wrapper: createQueryWrapper() });

    const checklistButtons = screen.getAllByLabelText(/toggle completed/i);
    
    // First routine should not be completed
    expect(checklistButtons[0]).toHaveAttribute('data-completed', 'false');
    
    // Third routine should be completed
    expect(checklistButtons[2]).toHaveAttribute('data-completed', 'true');
  });

  it('should navigate to routine details when open button clicked', () => {
    render(<WorkoutsList />, { wrapper: createQueryWrapper() });

    const openButtons = screen.getAllByText(/open/i);
    expect(openButtons[0]).toHaveAttribute('href', '/routines/1');
  });

  it('should show start workout button', () => {
    render(<WorkoutsList />, { wrapper: createQueryWrapper() });

    const startButtons = screen.getAllByText(/start/i);
    expect(startButtons).toHaveLength(mockRoutines.length);
  });

  it('should filter routines when filters are applied', () => {
    (useRoutines as jest.Mock).mockReturnValue({
      ...mockUseRoutines,
      data: mockRoutines.filter(r => r.isFavorite),
    });

    render(<WorkoutsList filters={{ isFavorite: true }} />, { wrapper: createQueryWrapper() });

    expect(screen.getByText('Pull Day')).toBeInTheDocument();
    expect(screen.queryByText('Push Day')).not.toBeInTheDocument();
    expect(screen.queryByText('Leg Day')).not.toBeInTheDocument();
  });

  it('should disable buttons when mutations are pending', () => {
    (useToggleRoutineFavorite as jest.Mock).mockReturnValue({
      ...mockUseToggleFavorite,
      isPending: true,
    });

    render(<WorkoutsList />, { wrapper: createQueryWrapper() });

    const heartButtons = screen.getAllByLabelText(/toggle favorite/i);
    expect(heartButtons[0]).toBeDisabled();
  });
});
