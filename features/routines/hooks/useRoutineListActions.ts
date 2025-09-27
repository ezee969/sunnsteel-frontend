import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { routineService } from '@/lib/api/services/routineService'
import {
  useDeleteRoutine,
  useToggleRoutineFavorite,
  useToggleRoutineCompleted,
} from '@/lib/api/hooks/useRoutines'
import { useStartSession } from '@/lib/api/hooks/useWorkoutSession'
import type { Routine } from '@/lib/api/types/routine.type'

/**
 * Manages UI state and action handlers for routine list operations.
 *
 * Provides state flags and callback functions for deleting routines, toggling favorite/completed status, and starting sessions.
 *
 * @returns An object containing:
 * - isDeleteDialogOpen: whether the delete confirmation dialog is open
 * - setIsDeleteDialogOpen: setter for the delete dialog state
 * - selectedRoutineId: id of the routine selected for deletion or `null`
 * - favoriteActingId: id of the routine currently performing a favorite toggle or `null`
 * - completedActingId: id of the routine currently performing a completed toggle or `null`
 * - startActingId: id of the routine currently starting a session or `null`
 * - lastStartReused: whether the last started session was reused
 * - isDeleting, isTogglingFavorite, isTogglingCompleted, isStarting: flags for ongoing async operations
 * - handleDeleteClick, handleConfirmDelete, handleToggleFavorite, handleToggleCompleted, handleStartSessionForRoutine: action handler functions
 */
export function useRoutineListActions() {
  const router = useRouter()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null)
  const [favoriteActingId, setFavoriteActingId] = useState<string | null>(null)
  const [completedActingId, setCompletedActingId] = useState<string | null>(null)
  const [startActingId, setStartActingId] = useState<string | null>(null)
  const [lastStartReused, setLastStartReused] = useState(false)

  const { mutate: deleteRoutine, isPending: isDeleting } = useDeleteRoutine()
  const { mutate: toggleFavorite, isPending: isTogglingFavorite } =
    useToggleRoutineFavorite()
  const { mutate: toggleCompleted, isPending: isTogglingCompleted } =
    useToggleRoutineCompleted()
  const { mutateAsync: startSession, isPending: isStarting } = useStartSession()

  const handleDeleteClick = (routineId: string) => {
    setSelectedRoutineId(routineId)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!selectedRoutineId) return
    deleteRoutine(selectedRoutineId, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        setSelectedRoutineId(null)
      },
    })
  }

  const handleToggleFavorite = (routine: Routine) => {
    if (!routine?.id) return
    setFavoriteActingId(routine.id)
    toggleFavorite(
      { id: routine.id, isFavorite: !routine.isFavorite },
      { onSettled: () => setFavoriteActingId(null) },
    )
  }

  const handleToggleCompleted = (routine: Routine) => {
    if (!routine?.id) return
    setCompletedActingId(routine.id)
    toggleCompleted(
      { id: routine.id, isCompleted: !routine.isCompleted },
      { onSettled: () => setCompletedActingId(null) },
    )
  }

  const handleStartSessionForRoutine = async (
    routine: Routine,
    routineDayId?: string,
  ) => {
    try {
      setStartActingId(routine.id)
      let dayId = routineDayId ?? routine.days?.[0]?.id
      if (!dayId) {
        const full = await routineService.getById(routine.id)
        dayId = full.days?.[0]?.id
      }
      if (!dayId) return
      const session = (await startSession({
        routineId: routine.id,
        routineDayId: dayId,
      })) as { id?: string; _reused?: boolean }
      setLastStartReused(!!session?._reused)
      if (session?.id) {
        router.push(`/workouts/sessions/${session.id}`)
      }
    } catch (err) {
      // handled by UI layer if needed
    } finally {
      setStartActingId(null)
    }
  }

  return {
    // state
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    selectedRoutineId,
    favoriteActingId,
    completedActingId,
    startActingId,
    lastStartReused,
    // async flags
    isDeleting,
    isTogglingFavorite,
    isTogglingCompleted,
    isStarting,
    // handlers
    handleDeleteClick,
    handleConfirmDelete,
    handleToggleFavorite,
    handleToggleCompleted,
    handleStartSessionForRoutine,
  }
}
