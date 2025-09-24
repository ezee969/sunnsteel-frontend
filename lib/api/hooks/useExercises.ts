import { useQuery } from '@tanstack/react-query';
import { exercisesService } from '../services/exercisesService';
import { usePerformanceQuery } from '@/hooks/use-performance-query';

export const useExercises = () => {
  return usePerformanceQuery({
    queryKey: ['exercises'],
    queryFn: exercisesService.getAll,
    staleTime: 1000 * 60 * 30, // 30 minutes - exercises rarely change
    gcTime: 1000 * 60 * 60, // 1 hour
  }, 'Exercises Load');
};
