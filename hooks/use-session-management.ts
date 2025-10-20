import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFinishSession } from '@/lib/api/hooks';
import type { Routine } from '@/lib/api/types/routine.type';
import type { SetLog } from '@/lib/api/types/workout.type';
import type { SessionStatus, SessionProgressData } from '@/lib/utils/workout-session.types';
import { calculateSessionProgress, areAllSetsCompleted } from '@/lib/utils/session-progress.utils';
import { SESSION_STATUS } from '@/lib/constants/session.constants';

interface UseSessionManagementProps {
  sessionId: string;
  routine?: Routine;
  routineDayId?: string;
  setLogs?: SetLog[];
  isDeloadWeek?: boolean;
}

interface UseSessionManagementReturn {
  // State
  isConfirmingFinish: boolean;
  finishStatus: SessionStatus | null;
  
  // Progress data
  progressData: SessionProgressData;
  
  // Actions
  handleFinishAttempt: (status: SessionStatus) => void;
  executeFinish: (status: SessionStatus) => void;
  cancelFinish: () => void;
  
  // Status
  isFinishing: boolean;
}

/**
 * Custom hook for managing workout session finishing logic and progress tracking
 */
export const useSessionManagement = ({
  sessionId,
  routine,
  routineDayId,
  setLogs,
  isDeloadWeek,
}: UseSessionManagementProps): UseSessionManagementReturn => {
  const router = useRouter();
  const { mutate: finishSession, isPending: isFinishing } = useFinishSession(sessionId);
  
  const [isConfirmingFinish, setIsConfirmingFinish] = useState(false);
  const [finishStatus, setFinishStatus] = useState<SessionStatus | null>(null);

  // Calculate progress data
  const progressData = (() => {
    if (!routine || !routineDayId || !setLogs) {
      return { totalSets: 0, completedSets: 0, percentage: 0 };
    }
    
    const day = routine.days.find((d) => d.id === routineDayId);
    if (!day) {
      return { totalSets: 0, completedSets: 0, percentage: 0 };
    }
    const effectiveExercises = isDeloadWeek
      ? day.exercises.map((re) =>
          re.progressionScheme === 'PROGRAMMED_RTF' ||
          re.progressionScheme === 'PROGRAMMED_RTF_HYPERTROPHY'
            ? { ...re, sets: re.sets.filter((s) => s.setNumber <= 3) }
            : re,
        )
      : day.exercises

    return calculateSessionProgress(setLogs, effectiveExercises);
  })();

  /**
   * Handles the initial finish attempt, checking if confirmation is needed
   */
  const handleFinishAttempt = useCallback((status: SessionStatus) => {
    if (status === SESSION_STATUS.ABORTED) {
      setFinishStatus(SESSION_STATUS.ABORTED);
      setIsConfirmingFinish(true);
      return;
    }

    if (!routine || !routineDayId || !setLogs) {
      setFinishStatus(status);
      setIsConfirmingFinish(true);
      return;
    }

    const day = routine.days.find((d) => d.id === routineDayId)
    const effectiveExercises = day
      ? (isDeloadWeek
          ? day.exercises.map((re) =>
              re.progressionScheme === 'PROGRAMMED_RTF' ||
              re.progressionScheme === 'PROGRAMMED_RTF_HYPERTROPHY'
                ? { ...re, sets: re.sets.filter((s) => s.setNumber <= 3) }
                : re,
            )
          : day.exercises)
      : []

    const allSetsCompleted = day ? areAllSetsCompleted(setLogs, effectiveExercises) : false;

    if (allSetsCompleted) {
      executeFinish(status);
    } else {
      setFinishStatus(status);
      setIsConfirmingFinish(true);
    }
  }, [routine, routineDayId, setLogs, isDeloadWeek]);

  /**
   * Executes the session finish operation
   */
  const executeFinish = useCallback((status: SessionStatus) => {
    if (!status) return;
    
    finishSession(
      { status },
      {
        onSuccess: () => {
          // Reset confirmation state on success and navigate away
          setIsConfirmingFinish(false);
          setFinishStatus(null);
          router.push('/dashboard');
        },
        onError: (error) => {
          console.error('Failed to finish session:', error);
          // Reset confirmation state on error
          setIsConfirmingFinish(false);
          setFinishStatus(null);
        },
      }
    );
  }, [finishSession, router]);

  /**
   * Cancels the finish confirmation dialog
   */
  const cancelFinish = useCallback(() => {
    setIsConfirmingFinish(false);
    setFinishStatus(null);
  }, []);

  return {
    // State
    isConfirmingFinish,
    finishStatus,
    
    // Progress data
    progressData,
    
    // Actions
    handleFinishAttempt,
    executeFinish,
    cancelFinish,
    
    // Status
    isFinishing,
  };
};