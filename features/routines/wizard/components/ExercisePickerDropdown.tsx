'use client'

import { forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, ChevronsUpDown } from 'lucide-react'
import { formatMuscleGroups } from '@/lib/utils/muscle-groups'
import type { Exercise } from '@/lib/api/types'

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

export const ExercisePickerDropdown = forwardRef<HTMLDivElement, ExercisePickerDropdownProps>(
	function ExercisePickerDropdown(
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
						<span className="hidden xs:inline">Add Exercise</span>
						<span className="xs:hidden">Add</span>
					</div>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>

				{isOpen && (
					<div className="absolute top-full left-0 sm:right-0 sm:left-auto z-50 w-full sm:w-[300px] mt-2 bg-popover border rounded-md shadow-lg animate-in fade-in-0 zoom-in-95 duration-200 max-h-[400px] overflow-hidden">
						<div className="p-3 border-b">
							<Input
								aria-label="Search exercises"
								placeholder="Search exercises..."
								value={searchValue}
								onChange={(event) => onSearchChange(event.target.value)}
								className="border-none focus:ring-0 focus-visible:ring-0"
							/>
						</div>
						<div className="max-h-[200px] overflow-y-auto p-2">
							{isLoading ? (
								<div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
									<Loader2 className="h-4 w-4 animate-spin" />
									Loading...
								</div>
							) : exercises.length > 0 ? (
								<div className="space-y-1">
									{exercises.map((exercise) => (
										<Button
											key={exercise.id}
											variant="ghost"
											className="w-full justify-start px-3 py-3 h-auto"
											onClick={() => {
												onSelect(exercise.id)
												onClose()
											}}
										>
											<div className="flex flex-col items-start">
												<span className="text-sm font-medium">
													{exercise.name}
												</span>
												<span className="text-xs text-muted-foreground">
													{exercise.primaryMuscles?.length
															? formatMuscleGroups(exercise.primaryMuscles)
															: 'Unknown'}{' '}
														• {exercise.equipment}
												</span>
											</div>
										</Button>
									))}
								</div>
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
	},
)
