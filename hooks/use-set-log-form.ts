import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { useSaveState, setSaveState } from '@/lib/utils/save-status-store';
import { markSetPending } from '@/lib/api/hooks/useWorkoutSession';
import type { UpsertSetLogPayload } from '@/lib/utils/workout-session.types';
import { validateSetLogPayload, isSetComplete } from '@/lib/utils/session-validation.utils';
import { DEBOUNCE_DELAYS } from '@/lib/constants/session.constants';

interface UseSetLogFormProps {
  sessionId: string;
  routineExerciseId: string;
  exerciseId: string;
  setNumber: number;
  initialReps: number;
  initialWeight?: number;
  initialIsCompleted: boolean;
  onSave: (payload: UpsertSetLogPayload) => void;
}

interface UseSetLogFormReturn {
  // Form state
  repsState: string;
  weightState: string;
  isCompletedState: boolean;
  
  // Save state
  saveState: 'idle' | 'pending' | 'saving' | 'saved' | 'error';
  
  // Form handlers
  setReps: (value: string) => void;
  setWeight: (value: string) => void;
  handleCompletionToggle: (checked: boolean) => void;
  
  // Validation
  isValid: boolean;
  validationError?: string;
}

/**
 * Custom hook for managing set log form state, validation, and auto-save functionality
 */
export const useSetLogForm = ({
  sessionId,
  routineExerciseId,
  exerciseId,
  setNumber,
  initialReps,
  initialWeight,
  initialIsCompleted,
  onSave,
}: UseSetLogFormProps): UseSetLogFormReturn => {
  // Form state
  const [repsState, setRepsState] = useState<string>(
    initialReps > 0 ? String(initialReps) : ''
  );
  const [weightState, setWeightState] = useState<string>(
    initialWeight !== undefined && initialWeight !== null ? String(initialWeight) : ''
  );
  const [isCompletedState, setIsCompletedState] = useState<boolean>(initialIsCompleted ?? false);

  // Debounced values for auto-save
  const debouncedReps = useDebounce(repsState, DEBOUNCE_DELAYS.SET_LOG_SAVE);
  const debouncedWeight = useDebounce(weightState, DEBOUNCE_DELAYS.SET_LOG_SAVE);

  // Save state tracking
  const saveState = useSaveState(`set:${sessionId}:${routineExerciseId}:${setNumber}`);

  // Store latest onSave callback in ref to prevent infinite loop
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Track last saved values to prevent redundant saves
  const lastSavedRef = useRef({ reps: initialReps, weight: initialWeight, isCompleted: initialIsCompleted });

  // Sync lastSavedRef when initial values change (from external updates/refetch)
  useEffect(() => {
    lastSavedRef.current = {
      reps: initialReps,
      weight: initialWeight,
      isCompleted: initialIsCompleted,
    };
  }, [initialReps, initialWeight, initialIsCompleted, setNumber]);

  // Create payload for validation and saving
  const createPayload = useCallback((
    reps: string,
    weight: string,
    isCompleted: boolean
  ): UpsertSetLogPayload => ({
    routineExerciseId,
    exerciseId,
    setNumber,
    reps: Number(reps) || 0,
    weight: weight === '' ? undefined : Number(weight),
    isCompleted,
  }), [routineExerciseId, exerciseId, setNumber]);

  // Validate current form state
  const currentPayload = createPayload(repsState, weightState, isCompletedState);
  const validation = validateSetLogPayload(currentPayload);

  // Auto-save effect for debounced values
  useEffect(() => {
    const currentReps = Number(debouncedReps) || 0;
    const currentWeight = debouncedWeight === '' ? undefined : Number(debouncedWeight);

    // Normalize nullish weights for stable comparisons (null === undefined)
    const norm = (w: number | undefined | null) => (w == null ? null : w);
    const normCurrentWeight = norm(currentWeight);
    const normSavedWeight = norm(lastSavedRef.current.weight);

    // Check against last saved values (with normalized nullish weight)
    const hasChanged = 
      currentReps !== lastSavedRef.current.reps || 
      normCurrentWeight !== normSavedWeight ||
      isCompletedState !== lastSavedRef.current.isCompleted;
    
    if (!hasChanged) {
      // Cancel pending state if values reverted to last saved
      if (saveState === 'pending') {
        setSaveState(`set:${sessionId}:${routineExerciseId}:${setNumber}`, 'idle');
      }
      return;
    }

    // Only save if validation passes
    if (validation.isValid) {
      const payload = createPayload(debouncedReps, debouncedWeight, isCompletedState);
      onSaveRef.current(payload);
      // Update last saved values to prevent redundant saves
      lastSavedRef.current = {
        reps: currentReps,
        weight: currentWeight,
        isCompleted: isCompletedState,
      };
    }
  }, [
    debouncedReps,
    debouncedWeight,
    isCompletedState,
    saveState,
    sessionId,
    routineExerciseId,
    setNumber,
    validation.isValid,
    createPayload,
  ]);

  // Immediate feedback effect for pending state
  useEffect(() => {
    const currentReps = Number(repsState) || 0;
    const currentWeight = weightState === '' ? undefined : Number(weightState);
    // Normalize nullish weights for stable comparisons (null === undefined)
    const norm = (w: number | undefined | null) => (w == null ? null : w);
    const hasImmediateChange = 
      currentReps !== lastSavedRef.current.reps || 
      norm(currentWeight) !== norm(lastSavedRef.current.weight);
    
    if (hasImmediateChange && saveState === 'idle') {
      // Only mark as pending if we're not already in a save flow
      markSetPending(sessionId, routineExerciseId, setNumber);
    } else if (!hasImmediateChange && saveState === 'pending') {
      // Cancel pending immediately if reverted before debounce
      setSaveState(`set:${sessionId}:${routineExerciseId}:${setNumber}`, 'idle');
    }
  }, [
    repsState,
    weightState,
    saveState,
    sessionId,
    routineExerciseId,
    setNumber,
  ]);

  // Form handlers
  const setReps = useCallback((value: string) => {
    setRepsState(value);
  }, []);

  const setWeight = useCallback((value: string) => {
    setWeightState(value);
  }, []);

  const handleCompletionToggle = useCallback((checked: boolean) => {
    setIsCompletedState(checked);
    markSetPending(sessionId, routineExerciseId, setNumber);
    
    // Immediately save completion toggle
    const payload = createPayload(repsState, weightState, checked);
    if (validateSetLogPayload(payload).isValid) {
      onSaveRef.current(payload);
      // Update last saved values to prevent redundant saves
      const w = weightState === '' ? undefined : Number(weightState);
      lastSavedRef.current = {
        reps: Number(repsState) || 0,
        weight: w,
        isCompleted: checked,
      };
    }
  }, [
    sessionId,
    routineExerciseId,
    setNumber,
    repsState,
    weightState,
    createPayload,
  ]);

  return {
    // Form state
    repsState,
    weightState,
    isCompletedState,
    
    // Save state
    saveState,
    
    // Form handlers
    setReps,
    setWeight,
    handleCompletionToggle,
    
    // Validation
    isValid: validation.isValid,
    validationError: validation.errors[0], // Use first error from errors array
  };
};