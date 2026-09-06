import { CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronsUpDown, Clock, Trash2 } from 'lucide-react'
import { formatMuscleGroups } from '@/lib/utils/muscle-groups'
import { formatTime } from '@/lib/utils/time'
import type { Exercise } from '@/lib/api/types'
import type { RoutineWizardExercise } from '../types'
import { getPresetSetCountForScheme } from '../utils/progression.helpers'
import { cn } from '@/lib/utils'

interface ExerciseHeaderProps {
	exercise: RoutineWizardExercise
	exerciseData?: Exercise
	expanded: boolean
	controlsId: string
	onHeaderClick: () => void
	onHeaderKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
	onToggleButtonClick: (event: React.MouseEvent<HTMLButtonElement>) => void
	onRemoveButtonClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}

/**
 * Render the header for a routine-wizard exercise, showing the exercise name, summary (planned sets and rest) when collapsed, detailed muscles and equipment when expanded, and action buttons to toggle sets or remove the exercise.
 *
 * @param exercise - RoutineWizardExercise used to compute planned sets and rest time
 * @param exerciseData - Optional exercise metadata (name, primary muscles, equipment) used for display; falls back to placeholders when absent
 * @param expanded - Whether the header is in its expanded state (affects layout and visible details)
 * @param controlsId - ID of the collapsible sets region referenced by ARIA attributes
 * @param onHeaderClick - Click handler for the header element
 * @param onHeaderKeyDown - Keyboard event handler for header interactions
 * @param onToggleButtonClick - Click handler for the toggle-sets button
 * @param onRemoveButtonClick - Click handler for the remove-exercise button
 * @returns The header element for an exercise with accessible attributes and interactive controls
 */
export function ExerciseHeader({
	exercise,
	exerciseData,
	expanded,
	controlsId,
	onHeaderClick,
	onHeaderKeyDown,
	onToggleButtonClick,
	onRemoveButtonClick,
}: ExerciseHeaderProps) {
	const plannedSets = getPresetSetCountForScheme(
		exercise.progressionScheme,
		exercise.sets.length,
	)

	const restMinutes = Math.floor(exercise.restSeconds / 60)
	const restSeconds = (exercise.restSeconds % 60).toString().padStart(2, '0')

	return (
		<CardHeader
			className={cn(
				'cursor-pointer transition-all duration-200 hover:bg-muted/30',
				expanded ? 'p-3 sm:p-4' : 'p-2 sm:p-3',
			)}
			role="button"
			tabIndex={0}
			aria-label="Toggle exercise sets"
			aria-expanded={expanded}
			aria-controls={controlsId}
			onClick={onHeaderClick}
			onKeyDown={onHeaderKeyDown}
		>
			<div className={cn('flex items-center justify-between', expanded ? 'gap-3' : 'gap-2')}>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 min-w-0">
						<div className="flex-1 min-w-0">
							<h4
								className={cn(
									'font-medium truncate',
									expanded ? 'text-base sm:text-base' : 'text-sm sm:text-base',
								)}
							>
								{exerciseData?.name ?? 'Exercise'}
							</h4>
							{expanded && (
								<p className="text-xs sm:text-sm text-muted-foreground truncate">
									{exerciseData?.primaryMuscles
											? formatMuscleGroups(exerciseData.primaryMuscles)
											: 'Unknown'}{' '}
									• {exerciseData?.equipment}
								</p>
							)}
						</div>
						{!expanded && (
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
								<Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5">
									{plannedSets}
								</Badge>
								<div className="flex items-center gap-0.5">
									<Clock className="h-3 w-3" />
									<span className="text-[10px] sm:text-xs">
										{restMinutes}:{restSeconds}
									</span>
								</div>
							</div>
						)}
					</div>
				</div>
				<div className="flex items-center gap-1 shrink-0">
					<Button
						variant="ghost"
						size="sm"
						aria-label="Toggle sets"
						aria-expanded={expanded}
						aria-controls={controlsId}
						onClick={onToggleButtonClick}
						className={cn('p-0', expanded ? 'h-8 w-8' : 'h-6 w-6')}
					>
						<ChevronsUpDown
							className={cn(
								'transition-transform duration-300 ease-in-out',
								expanded ? 'h-4 w-4 rotate-180' : 'h-3 w-3',
							)}
						/>
					</Button>
					<Button
						variant="ghost"
						size="sm"
						aria-label="Remove exercise"
						onClick={onRemoveButtonClick}
						className={cn('p-0 text-muted-foreground hover:text-destructive', expanded ? 'h-8 w-8' : 'h-6 w-6')}
					>
						<Trash2 className={expanded ? 'h-4 w-4' : 'h-3 w-3'} />
					</Button>
				</div>
			</div>
		</CardHeader>
	)
}
