'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RoutineWizardData } from './types'
import { useRoutineMetadataForm } from './hooks/useRoutineMetadataForm'

interface RoutineBasicInfoProps {
	data: RoutineWizardData
	onUpdate: (updates: Partial<RoutineWizardData>) => void
}

export function RoutineBasicInfo({ data, onUpdate }: RoutineBasicInfoProps) {
	const { name, description, handleNameChange, handleDescriptionChange } =
		useRoutineMetadataForm({ data, onUpdate })

	return (
		<TooltipProvider>
			<div className="space-y-6">
				<div className="space-y-2">
					<Label htmlFor="routine-name">
						Routine Name <span className="text-destructive">*</span>
					</Label>
					<Input
						id="routine-name"
						placeholder="e.g., Push Pull Legs"
						value={name}
						onChange={e => handleNameChange(e.target.value)}
						className="text-lg"
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
