'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TooltipProvider } from '@/components/ui/tooltip'

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
			</div>
		</TooltipProvider>
	)
}
