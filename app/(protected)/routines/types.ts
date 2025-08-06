export type WorkoutFilter = 'all' | 'recent' | 'favorites' | 'completed';

export interface Workout {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  exercises: Exercise[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetMuscles: string[];
  favorite: boolean;
  lastPerformed?: string; // ISO date string
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  restTime: number; // in seconds
  notes?: string;
}
