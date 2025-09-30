'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WorkoutDialogsProps {
  // Active session conflict dialog
  activeConflictOpen: boolean;
  onActiveConflictClose: () => void;
  onGoToActiveSession?: () => void;
  
  // Date validation dialog
  dateValidationOpen: boolean;
  onDateValidationClose: () => void;
  
  // Date confirmation dialog
  dateConfirmOpen: boolean;
  onDateConfirm: () => void;
  onDateConfirmClose: () => void;
}

/**
 * Compound component containing all workout-related dialogs
 * 
 * Includes:
 * - Active session conflict dialog
 * - Date validation error dialog
 * - Date confirmation dialog for mismatched days
 */
export const WorkoutDialogs = ({
  activeConflictOpen,
  onActiveConflictClose,
  onGoToActiveSession,
  dateValidationOpen,
  onDateValidationClose,
  dateConfirmOpen,
  onDateConfirm,
  onDateConfirmClose,
}: WorkoutDialogsProps) => {
  return (
    <>
      {/* Active Session Conflict Dialog */}
      <Dialog open={activeConflictOpen} onOpenChange={onActiveConflictClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Active Session Detected</DialogTitle>
            <DialogDescription>
              You have an active workout session for a different day. Please finish or abandon your current session before starting a new one.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onActiveConflictClose}>
              Cancel
            </Button>
            {onGoToActiveSession && (
              <Button onClick={onGoToActiveSession}>
                Go to Active Session
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Date Validation Error Dialog */}
      <Dialog open={dateValidationOpen} onOpenChange={onDateValidationClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot Start Workout</DialogTitle>
            <DialogDescription>
              This workout day cannot be started today. Please check the program schedule or try again on the appropriate day.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onDateValidationClose}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Date Confirmation Dialog */}
      <Dialog open={dateConfirmOpen} onOpenChange={onDateConfirmClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Workout Day</DialogTitle>
            <DialogDescription>
              This workout is scheduled for a different day of the week. Are you sure you want to start it today?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onDateConfirmClose}>
              Cancel
            </Button>
            <Button onClick={onDateConfirm}>
              Start Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};