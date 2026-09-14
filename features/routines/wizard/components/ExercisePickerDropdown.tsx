'use client'

import { ChevronsUpDown, Loader2, Plus } from 'lucide-react'
import { forwardRef, useEffect, useMemo, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStarredExercises } from '@/lib/api/hooks/useExercises'
import { useTrainedExercises } from '@/lib/api/hooks/useWorkoutSession'
import type { Exercise } from '@/lib/api/types'
import { groupPickerExercises } from '@/lib/utils/exercise-picker'
import { formatMuscleGroups } from '@/lib/utils/muscle-groups'

export interface ExercisePickerDropdownProps {
	isOpen: boolean
	onToggle: () => void
	onClose: () => void
	searchValue: string
	onSearchChange: (value: string) => void
	exercises: Exercise[]
	isLoading: boolean
	onSelect: (exerciseId: string) => void
}

export const ExercisePickerDropdown = forwardRef<
	HTMLDivElement,
	ExercisePickerDropdownProps
>(function ExercisePickerDropdown(
	{
		isOpen,
		onToggle,
		onClose,
		searchValue,
		onSearchChange,
		exercises,
		isLoading,
		onSelect,
	},
	ref,
) {
	const inputRef = useRef<HTMLInputElement>(null)
	const stars = useStarredExercises()
	const trained = useTrainedExercises()

	// EXER-07: with no search, starred and recently trained exercises lead.
	const groups = useMemo(
		() =>
			searchValue.trim()
				? [{ key: 'matches', label: null, exercises }]
				: groupPickerExercises(exercises, {
						starred: stars.data?.items.map(item => item.exerciseId),
						recent: trained.data,
					}),
		[exercises, searchValue, stars.data, trained.data],
	)

	useEffect(() => {
		if (isOpen) {
			const id = requestAnimationFrame(() => {
				inputRef.current?.focus()
			})
			return () => cancelAnimationFrame(id)
		}
	}, [isOpen])

	return (
		<div className="relative w-full sm:w-auto" ref={ref}>
			<Button
				onClick={onToggle}
				variant="outline"
				size="sm"
				className="justify-between w-full sm:min-w-[200px] h-10"
			>
				<div className="flex items-center gap-2">
					<Plus className="h-4 w-4" />
					<span>Add Exercise</span>
				</div>
				<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
			</Button>

			{isOpen && (
				<div className="absolute top-full left-0 z-50 mt-2 max-h-[400px] w-full overflow-hidden rounded-md border border-rule bg-popover shadow-overlay duration-[var(--motion-base)] animate-in fade-in-0 zoom-in-95 sm:right-0 sm:left-auto sm:w-[400px] dark:shadow-none">
					<div className="p-3 border-b">
						<Input
							aria-label="Search exercises"
							placeholder="Search exercises..."
							value={searchValue}
							onChange={event => onSearchChange(event.target.value)}
							className="border-none focus:ring-0 focus-visible:ring-0"
							ref={inputRef}
						/>
					</div>
					<div className="max-h-[260px] overflow-y-auto p-2">
						{isLoading ? (
							<div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
								<Loader2 className="h-4 w-4 animate-spin" />
								Loading...
							</div>
						) : exercises.length > 0 ? (
							groups.map(group => (
								<div key={group.key} className="mb-2 last:mb-0">
									{group.label ? (
										<p className="type-label px-3 pb-1 pt-1 text-ink-3">
											{group.label}
										</p>
									) : null}
									<ul aria-label={group.label ?? 'Matching exercises'}>
										{group.exercises.map(exercise => (
											<li key={exercise.id}>
												<Button
													variant="ghost"
													className="w-full justify-start px-3 py-3 h-auto"
													onClick={() => {
														onSelect(exercise.id)
														onClose()
													}}
												>
													<div className="flex flex-col items-start text-left">
														<span className="text-sm font-medium whitespace-normal break-words">
															{exercise.name}
														</span>
														<span className="text-xs text-muted-foreground whitespace-normal">
															{exercise.primaryMuscles?.length
																? formatMuscleGroups(exercise.primaryMuscles)
																: 'Unknown'}{' '}
															• {exercise.equipment}
														</span>
													</div>
												</Button>
											</li>
										))}
									</ul>
								</div>
							))
						) : (
							<div className="py-6 text-center text-sm text-muted-foreground">
								No exercises found
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
})
