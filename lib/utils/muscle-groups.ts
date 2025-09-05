// User-friendly muscle group names mapping
export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  // Chest
  PECTORAL: 'Pecs',
  
  // Back
  LATISSIMUS_DORSI: 'Lats',
  TRAPEZIUS: 'Traps',
  RHOMBOIDS: 'Rhomboids',
  TERES_MAJOR_MINOR: 'Teres',
  ERECTOR_SPINAE: 'Spinal Erectors',
  
  // Shoulders
  ANTERIOR_DELTOIDS: 'Front Delts',
  MEDIAL_DELTOIDS: 'Middle Delts', 
  REAR_DELTOIDS: 'Rear Delts',
  
  // Arms
  BICEPS: 'Biceps',
  TRICEPS: 'Triceps',
  FOREARMS: 'Forearms',
  
  // Legs
  QUADRICEPS: 'Quads',
  HAMSTRINGS: 'Hams',
  GLUTES: 'Glutes',
  CALVES: 'Calves',
  
  // Core
  CORE: 'Core',
};

/**
 * Convert technical muscle group name to user-friendly name
 */
export function getFriendlyMuscleName(muscleGroup: string): string {
  return MUSCLE_GROUP_LABELS[muscleGroup] || muscleGroup.toLowerCase().replace(/_/g, ' ');
}

/**
 * Convert array of technical muscle names to friendly names
 */
export function getFriendlyMuscleNames(muscleGroups: string[]): string[] {
  return muscleGroups.map(group => getFriendlyMuscleName(group));
}

/**
 * Format muscle groups for display (comma-separated)
 */
export function formatMuscleGroups(muscleGroups: string[], maxDisplay = 3): string {
  const friendlyNames = getFriendlyMuscleNames(muscleGroups);
  
  if (friendlyNames.length === 0) return '';
  if (friendlyNames.length <= maxDisplay) {
    return friendlyNames.join(', ');
  }
  
  const displayed = friendlyNames.slice(0, maxDisplay);
  const remaining = friendlyNames.length - maxDisplay;
  return `${displayed.join(', ')} +${remaining} more`;
}
