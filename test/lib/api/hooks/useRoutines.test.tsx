import { renderHook, waitFor } from '@testing-library/react';
import { useRoutines, useCreateRoutine, useToggleRoutineFavorite, useToggleRoutineCompleted } from '@/lib/api/hooks/useRoutines';
import { createQueryWrapper } from '@/test/utils';
import * as routineService from '@/lib/api/services/routineService';

// Mock the routine service
jest.mock('@/lib/api/services/routineService');

const mockRoutineService = routineService as jest.Mocked<typeof routineService>;

describe('Routine Hooks', () => {
  const mockRoutines = [
    {
      id: '1',
      name: 'Push Day',
      description: 'Chest, shoulders, triceps',
      isFavorite: false,
      isCompleted: false,
      userId: 'user1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Pull Day',
      description: 'Back, biceps',
      isFavorite: true,
      isCompleted: false,
      userId: 'user1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useRoutines', () => {
    it('should fetch all routines', async () => {
      mockRoutineService.getUserRoutines.mockResolvedValue(mockRoutines);

      const { result } = renderHook(() => useRoutines(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockRoutineService.getUserRoutines).toHaveBeenCalledWith({});
      expect(result.current.data).toEqual(mockRoutines);
    });

    it('should fetch routines with filters', async () => {
      const favoriteRoutines = mockRoutines.filter(r => r.isFavorite);
      mockRoutineService.getUserRoutines.mockResolvedValue(favoriteRoutines);

      const { result } = renderHook(() => useRoutines({ isFavorite: true }), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockRoutineService.getUserRoutines).toHaveBeenCalledWith({ isFavorite: true });
      expect(result.current.data).toEqual(favoriteRoutines);
    });

    it('should handle fetch error', async () => {
      const mockError = new Error('Failed to fetch routines');
      mockRoutineService.getUserRoutines.mockRejectedValue(mockError);

      const { result } = renderHook(() => useRoutines(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useCreateRoutine', () => {
    it('should create a new routine', async () => {
      const newRoutine = {
        id: '3',
        name: 'Leg Day',
        description: 'Quads, hamstrings, glutes',
        isFavorite: false,
        isCompleted: false,
        userId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRoutineService.createRoutine.mockResolvedValue(newRoutine);

      const { result } = renderHook(() => useCreateRoutine(), {
        wrapper: createQueryWrapper(),
      });

      const routineData = {
        name: 'Leg Day',
        description: 'Quads, hamstrings, glutes',
        trainingDays: ['Monday', 'Thursday'],
        days: [],
      };

      result.current.mutate(routineData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockRoutineService.createRoutine).toHaveBeenCalledWith(routineData);
      expect(result.current.data).toEqual(newRoutine);
    });

    it('should handle creation error', async () => {
      const mockError = new Error('Failed to create routine');
      mockRoutineService.createRoutine.mockRejectedValue(mockError);

      const { result } = renderHook(() => useCreateRoutine(), {
        wrapper: createQueryWrapper(),
      });

      result.current.mutate({
        name: 'Test Routine',
        description: '',
        trainingDays: [],
        days: [],
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useToggleRoutineFavorite', () => {
    it('should toggle routine favorite status', async () => {
      const updatedRoutine = { ...mockRoutines[0], isFavorite: true };
      mockRoutineService.toggleFavorite.mockResolvedValue(updatedRoutine);

      const { result } = renderHook(() => useToggleRoutineFavorite(), {
        wrapper: createQueryWrapper(),
      });

      result.current.mutate({
        id: '1',
        isFavorite: true,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockRoutineService.toggleFavorite).toHaveBeenCalledWith('1', true);
      expect(result.current.data).toEqual(updatedRoutine);
    });

    it('should handle toggle favorite error', async () => {
      const mockError = new Error('Failed to toggle favorite');
      mockRoutineService.toggleFavorite.mockRejectedValue(mockError);

      const { result } = renderHook(() => useToggleRoutineFavorite(), {
        wrapper: createQueryWrapper(),
      });

      result.current.mutate({
        id: '1',
        isFavorite: true,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useToggleRoutineCompleted', () => {
    it('should toggle routine completed status', async () => {
      const updatedRoutine = { ...mockRoutines[0], isCompleted: true };
      mockRoutineService.toggleCompleted.mockResolvedValue(updatedRoutine);

      const { result } = renderHook(() => useToggleRoutineCompleted(), {
        wrapper: createQueryWrapper(),
      });

      result.current.mutate({
        id: '1',
        isCompleted: true,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockRoutineService.toggleCompleted).toHaveBeenCalledWith('1', true);
      expect(result.current.data).toEqual(updatedRoutine);
    });

    it('should handle toggle completed error', async () => {
      const mockError = new Error('Failed to toggle completed');
      mockRoutineService.toggleCompleted.mockRejectedValue(mockError);

      const { result } = renderHook(() => useToggleRoutineCompleted(), {
        wrapper: createQueryWrapper(),
      });

      result.current.mutate({
        id: '1',
        isCompleted: true,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });
});
