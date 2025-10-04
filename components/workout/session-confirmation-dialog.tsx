'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Target } from 'lucide-react';
import type { SessionProgressData } from '@/lib/utils/workout-session.types';

interface SessionConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  progressData: SessionProgressData;
  routineName: string;
  isFinishing: boolean;
}

/**
 * Confirmation dialog for finishing workout sessions
 */
export const SessionConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  progressData,
  routineName,
  isFinishing,
}: SessionConfirmationDialogProps) => {
  const { completedSets, totalSets, percentage } = progressData;
  const isComplete = percentage === 100;
  const incompleteSets = totalSets - completedSets;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            )}
            Finish Session
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to finish your workout session for{' '}
                <span className="font-medium">{routineName}</span>?
              </p>

              {/* Progress Summary */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <Badge variant={isComplete ? "default" : "secondary"}>
                    {Math.round(percentage)}%
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {completedSets} of {totalSets} sets completed
                  </span>
                </div>

                {!isComplete && (
                  <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      {incompleteSets} set{incompleteSets !== 1 ? 's' : ''} remaining
                    </span>
                  </div>
                )}
              </div>

              {/* Warning for incomplete sessions */}
              {!isComplete && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Note:</strong> Finishing with incomplete sets will still save your progress, 
                    but you won&apos;t get the full benefit of the workout.
                  </p>
                </div>
              )}

              {/* Success message for complete sessions */}
              {isComplete && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>Great job!</strong> You&apos;ve completed all sets. 
                    Your progress will be saved and applied to future workouts.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isFinishing}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isFinishing}
            className={isComplete ? 
              'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800' : 
              'bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800'
            }
          >
            {isFinishing ? 'Finishing...' : 'Finish Session'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};