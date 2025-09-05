import { describe, it, expect } from 'vitest';
import { 
  calculateMuscleVolume, 
  calculateTotalMuscleVolumes, 
  calculateRoutineDayMuscleVolume,
  getInvolvedMuscles 
} from '@/lib/utils/volume';
import { MuscleGroup } from '@/lib/api/types/exercise.type';

describe('Volume Calculations', () => {
  describe('calculateMuscleVolume', () => {
    it('should calculate full volume for primary muscles', () => {
      const volume = calculateMuscleVolume(
        3, // sets
        10, // reps
        50, // weight
        [MuscleGroup.PECTORAL], // primary
        [MuscleGroup.TRICEPS], // secondary
        MuscleGroup.PECTORAL // target
      );
      
      expect(volume).toBe(3 * 10 * 50 * 1.0); // 1500
    });

    it('should calculate half volume for secondary muscles', () => {
      const volume = calculateMuscleVolume(
        3, // sets
        10, // reps
        50, // weight
        [MuscleGroup.PECTORAL], // primary
        [MuscleGroup.TRICEPS], // secondary
        MuscleGroup.TRICEPS // target
      );
      
      expect(volume).toBe(3 * 10 * 50 * 0.5); // 750
    });

    it('should return zero for non-involved muscles', () => {
      const volume = calculateMuscleVolume(
        3, // sets
        10, // reps
        50, // weight
        [MuscleGroup.PECTORAL], // primary
        [MuscleGroup.TRICEPS], // secondary
        MuscleGroup.QUADRICEPS // target
      );
      
      expect(volume).toBe(0);
    });
  });

  describe('calculateTotalMuscleVolumes', () => {
    it('should calculate total volumes for all muscles from multiple exercises', () => {
      const exercises = [
        {
          sets: 3,
          reps: 10,
          weight: 50,
          primaryMuscles: [MuscleGroup.PECTORAL],
          secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.ANTERIOR_DELTOIDS]
        },
        {
          sets: 3,
          reps: 8,
          weight: 80,
          primaryMuscles: [MuscleGroup.QUADRICEPS],
          secondaryMuscles: [MuscleGroup.GLUTES]
        }
      ];

      const volumes = calculateTotalMuscleVolumes(exercises);
      
      // Pectoral: primary in first exercise
      expect(volumes[MuscleGroup.PECTORAL]).toBe(3 * 10 * 50 * 1.0); // 1500
      
      // Triceps: secondary in first exercise
      expect(volumes[MuscleGroup.TRICEPS]).toBe(3 * 10 * 50 * 0.5); // 750
      
      // Quadriceps: primary in second exercise
      expect(volumes[MuscleGroup.QUADRICEPS]).toBe(3 * 8 * 80 * 1.0); // 1920
      
      // Glutes: secondary in second exercise
      expect(volumes[MuscleGroup.GLUTES]).toBe(3 * 8 * 80 * 0.5); // 960
      
      // Non-involved muscle should be zero
      expect(volumes[MuscleGroup.BICEPS]).toBe(0);
    });
  });

  describe('calculateRoutineDayMuscleVolume', () => {
    it('should calculate volume from routine day with fixed reps', () => {
      const routineDay = {
        exercises: [
          {
            exercise: {
              primaryMuscles: [MuscleGroup.PECTORAL],
              secondaryMuscles: [MuscleGroup.TRICEPS]
            },
            sets: [
              { reps: 10, weight: 50 },
              { reps: 8, weight: 55 }
            ]
          }
        ]
      };

      const volume = calculateRoutineDayMuscleVolume(routineDay, MuscleGroup.PECTORAL);
      
      // Primary muscle gets full volume from both sets
      expect(volume).toBe((1 * 10 * 50 * 1.0) + (1 * 8 * 55 * 1.0)); // 500 + 440 = 940
    });

    it('should calculate volume from routine day with range reps using average', () => {
      const routineDay = {
        exercises: [
          {
            exercise: {
              primaryMuscles: [MuscleGroup.QUADRICEPS],
              secondaryMuscles: [MuscleGroup.GLUTES]
            },
            sets: [
              { minReps: 8, maxReps: 12, weight: 100 } // Average: 10 reps
            ]
          }
        ]
      };

      const volume = calculateRoutineDayMuscleVolume(routineDay, MuscleGroup.GLUTES);
      
      // Secondary muscle gets half volume, using average reps
      expect(volume).toBe(1 * 10 * 100 * 0.5); // 500
    });

    it('should skip sets with missing reps or weight', () => {
      const routineDay = {
        exercises: [
          {
            exercise: {
              primaryMuscles: [MuscleGroup.PECTORAL],
              secondaryMuscles: []
            },
            sets: [
              { reps: 10, weight: null }, // No weight
              { reps: null, weight: 50 }, // No reps
              { reps: 8, weight: 60 }     // Valid
            ]
          }
        ]
      };

      const volume = calculateRoutineDayMuscleVolume(routineDay, MuscleGroup.PECTORAL);
      
      // Only the valid set should contribute
      expect(volume).toBe(1 * 8 * 60 * 1.0); // 480
    });
  });

  describe('getInvolvedMuscles', () => {
    it('should return all unique muscles from routine day', () => {
      const routineDay = {
        exercises: [
          {
            exercise: {
              primaryMuscles: [MuscleGroup.PECTORAL, MuscleGroup.TRICEPS],
              secondaryMuscles: [MuscleGroup.ANTERIOR_DELTOIDS]
            }
          },
          {
            exercise: {
              primaryMuscles: [MuscleGroup.QUADRICEPS],
              secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.GLUTES] // TRICEPS is duplicate
            }
          }
        ]
      };

      const muscles = getInvolvedMuscles(routineDay);
      
      expect(muscles).toHaveLength(5);
      expect(muscles).toContain(MuscleGroup.PECTORAL);
      expect(muscles).toContain(MuscleGroup.TRICEPS);
      expect(muscles).toContain(MuscleGroup.ANTERIOR_DELTOIDS);
      expect(muscles).toContain(MuscleGroup.QUADRICEPS);
      expect(muscles).toContain(MuscleGroup.GLUTES);
      
      // Should not have duplicates
      expect(muscles.filter(m => m === MuscleGroup.TRICEPS)).toHaveLength(1);
    });
  });
});
