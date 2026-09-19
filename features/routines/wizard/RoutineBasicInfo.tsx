'use client'

import {
	TRAINING_EXPERIENCE_LEVEL_VALUES,
	TRAINING_GOAL_VALUES,
	type TrainingExperienceLevel,
	type TrainingGoal,
} from '@sunsteel/contracts'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
	getTrainingExperienceLabel,
	getTrainingGoalLabel,
} from '@/lib/utils/training-identity'

import { useRoutineMetadataForm } from './hooks/useRoutineMetadataForm'
import { RoutineWizardData } from './types'

interface RoutineBasicInfoProps {
	data: RoutineWizardData
	onUpdate: (updates: Partial<RoutineWizardData>) => void
}

/**
 * Render the basic information section of a routine creation wizard.
 *
 * Renders inputs for the routine name and optional description. State is
 * derived from `data` and updates are applied through `onUpdate`.
 *
 * @param data - Current routine wizard data used to populate the inputs
 * @param onUpdate - Callback to apply partial updates to the routine wizard data
 * @returns The rendered routine name and description fields
 */
export function RoutineBasicInfo({ data, onUpdate }: RoutineBasicInfoProps) {
	const { name, description, handleNameChange, handleDescriptionChange } =
		useRoutineMetadataForm({ data, onUpdate })

	return (
		<TooltipProvider>
			<div className="space-y-6">
				<div className="space-y-2">
					<Label htmlFor="routine-name">
						Routine Name <span className="text-ink-3">*</span>
					</Label>
					<Input
						id="routine-name"
						className="max-w-[var(--cluster-max)]"
						placeholder="e.g., Push Pull Legs"
						value={name}
						onChange={e => handleNameChange(e.target.value)}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="routine-description">Description</Label>
					<Textarea
						id="routine-description"
						placeholder="Describe your routine, goals, or any notes..."
						value={description}
						onChange={e => handleDescriptionChange(e.target.value)}
						rows={4}
					/>
				</div>

				{/* ROUT-07: both optional. Left unset the routine simply is not
				    matched by those two discovery filters, which is honest -- the
				    alternative would be guessing a claim on the author's behalf. */}
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="routine-goal">Goal</Label>
						<NativeSelect
							id="routine-goal"
							value={data.goal ?? ''}
							onChange={e =>
								onUpdate({
									goal: (e.target.value || null) as TrainingGoal | null,
								})
							}
						>
							<option value="">Not specified</option>
							{TRAINING_GOAL_VALUES.map(value => (
								<option key={value} value={value}>
									{getTrainingGoalLabel(value)}
								</option>
							))}
						</NativeSelect>
					</div>

					<div className="space-y-2">
						<Label htmlFor="routine-experience">Experience level</Label>
						<NativeSelect
							id="routine-experience"
							value={data.experienceLevel ?? ''}
							onChange={e =>
								onUpdate({
									experienceLevel: (e.target.value ||
										null) as TrainingExperienceLevel | null,
								})
							}
						>
							<option value="">Not specified</option>
							{TRAINING_EXPERIENCE_LEVEL_VALUES.map(value => (
								<option key={value} value={value}>
									{getTrainingExperienceLabel(value)}
								</option>
							))}
						</NativeSelect>
					</div>
				</div>
				<p className="type-body-sm max-w-[68ch] text-ink-3">
					These help other members find your routine if you share it. Leave them
					unset and it still appears, just not under those filters.
				</p>
			</div>
		</TooltipProvider>
	)
}
