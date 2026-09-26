'use client'

import { exerciseNameKey } from '@sunsteel/contracts'
import { ChevronsUpDown, Loader2, Plus } from 'lucide-react'
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CustomExerciseDialog } from '@/features/exercises/custom-exercise-dialog'
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
	// EXER-06: a search that names no exercise offers to create it.
	const [createName, setCreateName] = useState<string | null>(null)
	const query = searchValue.trim()
	const offerCreate =
		query.length > 0 &&
		!isLoading &&
		!exercises.some(
			exercise => exerciseNameKey(exercise.name) === exerciseNameKey(query),
		)

	// EXER-07: with no search, starred and recently trained exercises lead.
	const groups = useMemo(
		() =>
			searchValue.trim()
				? [{ key: 'matches', label: null, exercises }]
				: groupPickerExercises(exercises, {
						starred: stars.data?.items.map(item => item.exerciseId),
						recent: trained.data,
						recentPending: trained.isPending,
					}),
		[exercises, searchValue, stars.data, trained.data, trained.isPending],
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
									{'pending' in group && group.pending ? (
										<div
											role="status"
											className="type-body-sm flex items-center gap-2 px-3 py-2 text-ink-3"
										>
											<Loader2 className="size-4 animate-spin" aria-hidden />
											Loading recent exercises…
										</div>
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
															{exercise.isCustom ? 'Yours · ' : null}
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
						{offerCreate ? (
							<div className="border-t border-rule-faint pt-2">
								<Button
									type="button"
									variant="ghost"
									className="h-auto w-full justify-start px-3 py-3 text-left whitespace-normal"
									onClick={() => setCreateName(query)}
								>
									<Plus className="size-4 shrink-0" aria-hidden />
									Create “{query}” as your own exercise
								</Button>
							</div>
						) : null}
					</div>
				</div>
			)}
			<CustomExerciseDialog
				open={createName !== null}
				onOpenChange={open => {
					if (!open) setCreateName(null)
				}}
				initialName={createName ?? undefined}
				onSaved={exercise => {
					onSelect(exercise.id)
					onClose()
				}}
			/>
		</div>
	)
})
