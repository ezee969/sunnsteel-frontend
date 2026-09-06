"use client";

import { Button } from '@/components/ui/button';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, Save } from 'lucide-react';
import { useExercises } from '@/lib/api/hooks';
import type { RoutineWizardData } from './types';
import { useRoutineSubmission } from './hooks/useRoutineSubmission';
import { useRoutineExercisesLookup } from './hooks/useRoutineExercisesLookup';
import { RoutineDayCard } from './components/RoutineDayCard';
import { ProgramSettingsCard } from './components/ProgramSettingsCard';
import { RoutineSummaryStats } from './components/RoutineSummaryStats';
import { DAYS_OF_WEEK } from './utils/routine-summary';
import { useRoutineSummaryStats } from './hooks/useRoutineSummaryStats';

interface ReviewAndCreateProps {
	data: RoutineWizardData
	routineId?: string
	isEditing?: boolean
	onComplete: () => void
}

/**
 * Render a review-and-submit UI for creating or updating a workout routine.
 *
 * Displays a multi-section review of the provided routine data, program settings, summary statistics,
 * and a primary action to submit (create or update) the routine. Also shows brief post-submission guidance.
 *
 * @param data - RoutineWizardData containing the routine details to review
 * @param routineId - Optional ID of an existing routine being edited
 * @param isEditing - When true, the component renders in edit mode (changes labels and icons accordingly)
 * @param onComplete - Callback invoked after the submission process completes
 * @returns The rendered JSX element for the review-and-create workflow
 */
export function ReviewAndCreate({
	data,
	routineId,
	isEditing = false,
	onComplete,
}: ReviewAndCreateProps) {
	const { data: exercises } = useExercises()
	const exerciseMap = useRoutineExercisesLookup(exercises)

	const { submit, isLoading, usesRtf } = useRoutineSubmission({
		data,
		routineId,
		isEditing,
		onComplete,
	})
	const totals = useRoutineSummaryStats(data)

	return (
		<div className="space-y-6">
			<Accordion type="single" collapsible defaultValue="item-1" className="w-full">
				<AccordionItem value="item-1">
					<AccordionTrigger>
						<span className="flex items-center gap-2 text-base">
							<CheckCircle className="h-5 w-5 text-green-500" />
							Basic Information
						</span>
					</AccordionTrigger>
					<AccordionContent className="space-y-3 pl-1">
						<div>
							<p className="text-sm font-medium text-muted-foreground">Name</p>
							<p className="text-base">{data.name}</p>
						</div>
						{data.description && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">Description</p>
								<p className="text-sm text-muted-foreground">{data.description}</p>
							</div>
						)}
					</AccordionContent>
				</AccordionItem>

				<AccordionItem value="item-2">
					<AccordionTrigger>
						<span className="flex items-center gap-2 text-base">
							<CheckCircle className="h-5 w-5 text-green-500" />
							Training Schedule
						</span>
					</AccordionTrigger>
					<AccordionContent className="pl-1">
						<div className="flex flex-wrap gap-2 mb-2">
							{data.trainingDays.map((dayId) => (
								<Badge key={dayId} variant="secondary">
									{DAYS_OF_WEEK[dayId]}
								</Badge>
							))}
						</div>
						<p className="text-sm text-muted-foreground">
							{data.trainingDays.length} training days per week
						</p>
					</AccordionContent>
				</AccordionItem>

				<AccordionItem value="item-3">
					<AccordionTrigger>
						<span className="flex items-center gap-2 text-base">
							<CheckCircle className="h-5 w-5 text-green-500" />
							Workout Details
						</span>
					</AccordionTrigger>
					<AccordionContent className="space-y-4 pl-1">
						{data.days.map((day) => (
							<RoutineDayCard key={day.dayOfWeek} day={day} exerciseMap={exerciseMap} />
						))}
					</AccordionContent>
				</AccordionItem>
			</Accordion>

			<ProgramSettingsCard data={data} usesRtf={usesRtf} isEditing={isEditing} />

			<RoutineSummaryStats totals={totals} />

			<div className="flex gap-4">
				<Button
					onClick={submit}
					disabled={isLoading}
					className="w-full sm:w-auto"
					variant="classical"
				>
					{isLoading ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							{isEditing ? 'Updating...' : 'Creating...'}
						</>
					) : (
						<>
							{isEditing ? (
								<Save className="mr-2 h-4 w-4" />
							) : (
								<CheckCircle className="mr-2 h-4 w-4" />
							)}
							{isEditing ? 'Update Routine' : 'Create Routine'}
						</>
					)}
				</Button>
			</div>

			<div className="bg-muted/50 p-4 rounded-lg">
				<h4 className="font-medium mb-2">What happens next?</h4>
				<ul className="text-sm text-muted-foreground space-y-1">
					<li>• Your routine will be saved and available in your routines list</li>
					<li>• You can start workouts from this routine anytime</li>
					<li>• You can edit or duplicate this routine later</li>
					<li>• Track your progress as you complete workouts</li>
				</ul>
			</div>
		</div>
	)
}
