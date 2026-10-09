'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { InlineError } from '@/components/layout/inline-error'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { EmptyRoutinesState } from '@/features/routines/components/EmptyRoutinesState'
import { RoutineCard } from '@/features/routines/components/RoutineCard'
import { RoutinesSkeletonList } from '@/features/routines/components/RoutinesSkeletonList'
import { useRoutineListActions } from '@/features/routines/hooks/useRoutineListActions'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useActiveSession } from '@/lib/api/hooks/useWorkoutSession'
import { Routine } from '@/lib/api/types/routine.type'

interface WorkoutsListProps {
	routines: Routine[] | undefined
	isLoading: boolean
	error: Error | null
	/** A narrowing filter is applied, so an empty list is not an empty account. */
	filtered?: boolean
	onRetry?: () => void
}

/**
 * Render a scrollable list of routine cards, handling loading, error, empty states, and a delete confirmation dialog.
 *
 * @param routines - The list of routines to display; if `undefined` or empty, an empty state is shown.
 * @param isLoading - When `true`, renders a skeleton placeholder list instead of routines.
 * @param error - If provided, renders an error message describing the failure.
 * @returns The component's rendered UI as a React element.
 */
export default function WorkoutsList({
	routines,
	isLoading,
	error,
	filtered = false,
	onRetry,
}: WorkoutsListProps) {
	const errorText = useApiErrorMessage()
	const t = useTranslations('routines.listing')
	const {
		isDeleteDialogOpen,
		setIsDeleteDialogOpen,
		favoriteActingId,
		startActingId,
		lastStartReused,
		isDeleting,
		isTogglingFavorite,
		isStarting,
		handleDeleteClick,
		handleConfirmDelete,
		handleToggleFavorite,
		handleStartSessionForRoutine,
	} = useRoutineListActions()
	const { data: activeSession } = useActiveSession()

	if (isLoading) {
		return <RoutinesSkeletonList />
	}

	if (error) {
		return (
			<InlineError
				title={t('loadError')}
				message={errorText(error)}
				onRetry={onRetry}
			/>
		)
	}

	const displayedRoutines = routines ?? []

	if (displayedRoutines.length === 0) {
		return (
			<div>
				<EmptyRoutinesState filtered={filtered} />
			</div>
		)
	}

	return (
		<div>
			<div>
				{/* §11.5 — one ruled ledger, not a stack of boxes. The rules come
				    from each row's `.rule-row`, so the gap that used to separate
				    the cards is gone. */}
				<div className="border-t border-rule pb-4 sm:pr-4">
					{displayedRoutines.map(routine => {
						const isActiveRoutine =
							activeSession?.status === 'IN_PROGRESS' &&
							activeSession?.routineId === routine.id

						return (
							<RoutineCard
								key={routine.id}
								routine={routine}
								isActiveRoutine={isActiveRoutine}
								activeSessionId={activeSession?.id}
								onStartSession={handleStartSessionForRoutine}
								onToggleFavorite={handleToggleFavorite}
								onDelete={handleDeleteClick}
								isStarting={isStarting}
								startActingId={startActingId}
								lastStartReused={lastStartReused}
								isTogglingFavorite={isTogglingFavorite}
								favoriteActingId={favoriteActingId}
							/>
						)
					})}
				</div>
			</div>

			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
						<AlertDialogDescription>
							{t('deleteDescription')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? (
								<>
									<Loader2 aria-hidden className="h-4 w-4 animate-spin mr-2" />
									{t('deleting')}
								</>
							) : (
								t('delete')
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
