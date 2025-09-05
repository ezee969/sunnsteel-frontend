export enum MuscleGroup {
  PECTORAL = 'PECTORAL',
  LATISSIMUS_DORSI = 'LATISSIMUS_DORSI',
  TRAPEZIUS = 'TRAPEZIUS',
  REAR_DELTOIDS = 'REAR_DELTOIDS',
  ERECTOR_SPINAE = 'ERECTOR_SPINAE',
  TERES_MAJOR = 'TERES_MAJOR',
  TERES_MINOR = 'TERES_MINOR',
  ANTERIOR_DELTOIDS = 'ANTERIOR_DELTOIDS',
  MEDIAL_DELTOIDS = 'MEDIAL_DELTOIDS',
  BICEPS = 'BICEPS',
  FOREARMS = 'FOREARMS',
  TRICEPS = 'TRICEPS',
  QUADRICEPS = 'QUADRICEPS',
  HAMSTRINGS = 'HAMSTRINGS',
  GLUTES = 'GLUTES',
  CALVES = 'CALVES',
  CORE = 'CORE',
}

export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: string;
  createdAt: string;
  updatedAt: string;
}
