'use client'

import { CheckCircle, Loader2, Save } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { useExercises } from '@/lib/api/hooks'
import { useTrainingLocations } from '@/lib/api/hooks/useTrainingLocations'
import { weekdayName } from '@/lib/utils/date'

import { RoutineDayCard } from './components/RoutineDayCard'
import { RoutineQualitySummary } from './components/RoutineQualitySummary'
import { RoutineSummaryStats } from './components/RoutineSummaryStats'
import { useRoutineExercisesLookup } from './hooks/useRoutineExercisesLookup'
import { useRoutineQualitySummary } from './hooks/useRoutineQualitySummary'
import { useRoutineSubmission } from './hooks/useRoutineSubmission'
import { useRoutineSummaryStats } from './hooks/useRoutineSummaryStats'
import type { RoutineWizardData } from './types'
import { wizardDayTitle } from './utils/schedule'

interface ReviewAndCreateProps {
	data: RoutineWizardData
	routineId?: string
	isEditing?: boolean
	onComplete: () => void
}

/**
 * Render a review-and-submit UI for creating or updating a workout routine.
 *
 * Displays a multi-section review of the routine details, training schedule,
 * workout days and summary statistics, plus the create or update action.
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
	const {
		data: exercises,
		isLoading: isLoadingExercises,
		isError: exercisesFailed,
	} = useExercises()
	const {
		data: locations,
		isLoading: isLoadingLocations,
		isError: locationsFailed,
	} = useTrainingLocations()
	const weightUnit = useWeightUnit()
	const exerciseMap = useRoutineExercisesLookup(exercises)
	const t = useTranslations('routines.review')
	const tDate = useTranslations('routines.date')

	const { submit, isLoading } = useRoutineSubmission({
		data,
		routineId,
		isEditing,
		onComplete,
	})
	const totals = useRoutineSummaryStats(data)
	const quality = useRoutineQualitySummary(data, exerciseMap, locations)
	const qualityStatus = exercises
		? 'ready'
		: isLoadingExercises
			? 'loading'
			: exercisesFailed
				? 'error'
				: 'loading'

	return (
		<div className="space-y-6">
			<Accordion
				type="single"
				collapsible
				defaultValue="item-1"
				className="w-full"
			>
				<AccordionItem value="item-1">
					<AccordionTrigger>
						<span className="flex items-center gap-2 text-base">
							<CheckCircle className="h-5 w-5 text-success" aria-hidden />
							{t('basicInformation')}
						</span>
					</AccordionTrigger>
					<AccordionContent className="space-y-3 pl-1">
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								{t('name')}
							</p>
							<p className="text-base">{data.name}</p>
						</div>
						{data.description && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									{t('description')}
								</p>
								<p className="text-sm text-muted-foreground">
									{data.description}
								</p>
							</div>
						)}
					</AccordionContent>
				</AccordionItem>

				<AccordionItem value="item-2">
					<AccordionTrigger>
						<span className="flex items-center gap-2 text-base">
							<CheckCircle className="h-5 w-5 text-success" aria-hidden />
							{t('trainingSchedule')}
						</span>
					</AccordionTrigger>
					<AccordionContent className="pl-1">
						<div className="flex flex-wrap gap-2 mb-2">
							{data.days.map((day, index) => (
								<Badge key={day.slot} variant="secondary">
									{wizardDayTitle(data.scheduleMode, day, index, tDate)}
								</Badge>
							))}
						</div>
						<p className="text-sm text-muted-foreground">
							{data.scheduleMode === 'ROTATION'
								? t('rotationSummary', {
										days: data.days.length,
										when:
											data.rotationWeekdays.length > 0
												? t('rotationOnWeekdays', {
														weekdays: data.rotationWeekdays
															.map(day => weekdayName(day, 'long', tDate))
															.join(', '),
													})
												: t('rotationAnyWeekday'),
									})
								: t('weeklySummary', { days: data.trainingDays.length })}
						</p>
						{data.scheduleMode === 'WEEKLY' && data.restDays.length > 0 ? (
							<p className="text-sm text-muted-foreground">
								{t('restDays', {
									weekdays: data.restDays
										.map(day => weekdayName(day, 'long', tDate))
										.join(', '),
								})}
							</p>
						) : null}
					</AccordionContent>
				</AccordionItem>

				<AccordionItem value="item-3">
					<AccordionTrigger>
						<span className="flex items-center gap-2 text-base">
							<CheckCircle className="h-5 w-5 text-success" aria-hidden />
							{t('workoutDetails')}
						</span>
					</AccordionTrigger>
					<AccordionContent className="space-y-4 pl-1">
						{data.days.map((day, index) => (
							<RoutineDayCard
								key={day.slot}
								label={wizardDayTitle(data.scheduleMode, day, index, tDate)}
								day={day}
								exerciseMap={exerciseMap}
								weightUnit={weightUnit}
							/>
						))}
					</AccordionContent>
				</AccordionItem>
			</Accordion>

			<RoutineSummaryStats totals={totals} />

			<RoutineQualitySummary
				status={qualityStatus}
				summary={quality}
				showEquipmentCheck={!isLoadingLocations && !locationsFailed}
			/>

			<div className="flex gap-4">
				<Button
					onClick={submit}
					disabled={isLoading}
					className="w-full sm:w-auto"
					variant="default"
				>
					{isLoading ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							{isEditing ? t('updating') : t('creating')}
						</>
					) : (
						<>
							{isEditing ? (
								<Save className="mr-2 h-4 w-4" />
							) : (
								<CheckCircle className="mr-2 h-4 w-4" />
							)}
							{isEditing ? t('updateRoutine') : t('createRoutine')}
						</>
					)}
				</Button>
			</div>

			<div className="bg-muted/50 p-4 rounded-md">
				<h4 className="type-panel mb-2 text-foreground">{t('nextTitle')}</h4>
				<ul className="text-sm text-muted-foreground space-y-1">
					<li>{t('nextSaved')}</li>
					<li>{t('nextStart')}</li>
					<li>{t('nextEdit')}</li>
					<li>{t('nextTrack')}</li>
				</ul>
			</div>
		</div>
	)
}
