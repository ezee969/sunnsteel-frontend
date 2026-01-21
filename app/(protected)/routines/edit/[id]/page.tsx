'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { Stepper } from '@/components/ui/stepper'
import HeroSection from '@/components/layout/HeroSection'

// Step components
import { RoutineBasicInfo } from '@/features/routines/wizard/RoutineBasicInfo'
import { TrainingDays } from '@/features/routines/wizard/TrainingDays'
import { BuildDays } from '@/features/routines/wizard/BuildDays'
import { RtfConfiguration } from '@/features/routines/wizard/RtfConfiguration'
import { ReviewAndCreate } from '@/features/routines/wizard/ReviewAndCreate'
import {
	RoutineWizardData,
	ProgressionScheme,
} from '@/features/routines/wizard/types'
import { useRoutine, useUpdateRoutine, useCreateRoutine } from '@/lib/api/hooks'
import { RoutineDay, RoutineExercise } from '@/lib/api/types'
import { WizardNavigation } from '@/features/routines/wizard/WizardNavigation'

// Use shared RoutineWizardData

const BASE_STEPS = [
	{ id: 1, title: 'Basic Info', description: 'Name and description' },
	{ id: 2, title: 'Training Days', description: 'Select workout days' },
	{ id: 3, title: 'Build Days', description: 'Add exercises and sets' },
]

const RTF_STEP = {
	id: 4,
	title: 'RtF Configuration',
	description: 'Configure RtF program',
}
const REVIEW_STEP_WITHOUT_RTF = {
	id: 4,
	title: 'Review & Update',
	description: 'Review and save changes',
}
const REVIEW_STEP_WITH_RTF = {
	id: 5,
	title: 'Review & Update',
	description: 'Review and save changes',
}

// Normalize/compatibility mapping for legacy backend values
// Backend may send 'DYNAMIC' | 'DYNAMIC_DOUBLE'; the wizard uses
// 'DOUBLE_PROGRESSION' | 'DYNAMIC_DOUBLE_PROGRESSION' | 'NONE'
const mapProgressionScheme = (
	value: string | undefined | null,
): ProgressionScheme => {
	if (!value) return 'NONE'
	switch (value) {
		case 'NONE':
		case 'DOUBLE_PROGRESSION':
		case 'DYNAMIC_DOUBLE_PROGRESSION':
		case 'PROGRAMMED_RTF':
		case 'PROGRAMMED_RTF_HYPERTROPHY':
			return value as ProgressionScheme
		case 'DYNAMIC':
			return 'DOUBLE_PROGRESSION'
		case 'DYNAMIC_DOUBLE':
			return 'DYNAMIC_DOUBLE_PROGRESSION'
		default:
			return 'NONE'
	}
}

export default function EditRoutinePage() {
	const params = useParams<{ id: string }>()
	const routineId = (params?.id ?? '') as string
	const router = useRouter()
	const [currentStep, setCurrentStep] = useState(1)
	const [visitedSteps, setVisitedSteps] = useState(new Set([1]))
	const [routineData, setRoutineData] = useState<RoutineWizardData>({
		name: '',
		description: '',
		trainingDays: [],
		days: [],
	})

	const { data: routine, isLoading, error } = useRoutine(routineId)
	const updateRoutineMutation = useUpdateRoutine()
	const createRoutineMutation = useCreateRoutine()

	// Check if routine has RtF exercises
	const hasRtfExercises = routineData.days.some(d =>
		d.exercises.some(
			ex =>
				ex.progressionScheme === 'PROGRAMMED_RTF' ||
				ex.progressionScheme === 'PROGRAMMED_RTF_HYPERTROPHY',
		),
	)

	// Compute dynamic steps based on RtF presence
	const STEPS = hasRtfExercises
		? [...BASE_STEPS, RTF_STEP, REVIEW_STEP_WITH_RTF]
		: [...BASE_STEPS, REVIEW_STEP_WITHOUT_RTF]

	// Initialize form with routine data when loaded
	useEffect(() => {
		if (routine) {
			// Transform the routine data to match our form state
			const transformedData: RoutineWizardData = {
				name: routine.name,
				description: routine.description || '',
				trainingDays: routine.days.map((day: RoutineDay) => day.dayOfWeek),
				days: routine.days.map((day: RoutineDay) => ({
					dayOfWeek: day.dayOfWeek,
					exercises: day.exercises.map((exercise: RoutineExercise) => ({
						exerciseId: exercise.exercise.id,
						progressionScheme: mapProgressionScheme(
							(exercise as unknown as { progressionScheme?: string })
								.progressionScheme,
						),
						minWeightIncrement: exercise.minWeightIncrement || 2.5,
						// RtF mapping (optional fields on backend response)
						programTMKg: (exercise as unknown as { programTMKg?: number })
							.programTMKg,
						programRoundingKg: (
							exercise as unknown as { programRoundingKg?: number }
						).programRoundingKg,
						sets: exercise.sets.map((set, index) => ({
							setNumber: index + 1,
							repType: set.repType,
							reps: set.reps ?? null,
							minReps: set.minReps ?? null,
							maxReps: set.maxReps ?? null,
							weight: set.weight,
							rir: (set as unknown as { rir?: number | null }).rir ?? null,
						})),
						restSeconds: exercise.restSeconds,
					})),
				})),
				// Routine-level program fields (present only if routine uses RtF)
				programWithDeloads: (
					routine as unknown as { programWithDeloads?: boolean }
				).programWithDeloads,
				programStartDate: (routine as unknown as { programStartDate?: string })
					.programStartDate,
				programTimezone: (routine as unknown as { programTimezone?: string })
					.programTimezone,
				programScheduleMode: (
					routine as unknown as { programStartDate?: string }
				).programStartDate
					? 'TIMEFRAME'
					: 'NONE',
				// Front-end only metadata (default STANDARD if absent)
				// programStyle removed (per-exercise style now derived from progressionScheme)
			}

			setRoutineData(transformedData)
		}
	}, [routine])

	const updateRoutineData = (updates: Partial<RoutineWizardData>) => {
		setRoutineData(prev => ({ ...prev, ...updates }))
	}

	// Handle step adjustment when RtF exercises are added/removed
	useEffect(() => {
		// If we're on step 5 (Review with RtF) and RtF exercises were removed
		if (currentStep === 5 && !hasRtfExercises) {
			// Step 5 no longer exists, move back to step 4 (which is now Review)
			setCurrentStep(4)
		}
	}, [hasRtfExercises, currentStep])

	const handleNext = () => {
		if (currentStep < STEPS.length) {
			const nextStep = currentStep + 1
			setCurrentStep(nextStep)
			setVisitedSteps(prev => new Set([...prev, nextStep]))
		}
	}

	const handlePrevious = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1)
		}
	}

	const handleStepClick = (stepId: number) => {
		// Navigation will be controlled by Stepper's canStepClick; do a minimal guard here.
		setCurrentStep(stepId)
	}

	const isStepValid = (stepId: number) => {
		switch (stepId) {
			case 1:
				const hasName = routineData.name.trim() !== ''
				if (!hasName) return false

				// If Timeframe is selected, require program start date
				if (routineData.programScheduleMode === 'TIMEFRAME') {
					return (
						!!routineData.programStartDate &&
						routineData.programStartDate.trim() !== ''
					)
				}

				return true
			case 2:
				return routineData.trainingDays.length > 0
			case 3: {
				const daysComplete = routineData.days.every(
					day => day.exercises.length > 0,
				)
				if (!daysComplete) return false
				const usesRtf = routineData.days.some(d =>
					d.exercises.some(ex => ex.progressionScheme === 'PROGRAMMED_RTF'),
				)
				if (routineData.programScheduleMode === 'TIMEFRAME' && usesRtf) {
					return (
						!!routineData.programStartDate &&
						routineData.programStartDate.trim() !== ''
					)
				}
				return true
			}
			case 4:
				// Review step is considered valid if all previous steps are valid
				return [1, 2, 3].every(isStepValid)
			default:
				return false
		}
	}

	const arePreviousStepsValid = (stepId: number) => {
		if (stepId <= 1) return true
		const prevIds = Array.from({ length: stepId - 1 }, (_, i) => i + 1)
		return prevIds.every(isStepValid)
	}

	const canProceedToNextStep = () => {
		return isStepValid(currentStep)
	}

	const handleCancel = () => {
		router.push('/routines')
	}

	const renderCurrentStep = () => {
		if (isLoading) {
			return (
				<div className="flex flex-col items-center justify-center h-64 space-y-4">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
					<p className="text-muted-foreground">Loading routine data...</p>
				</div>
			)
		}

		if (error) {
			return (
				<div className="text-center py-12 space-y-4">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
						<svg
							className="h-6 w-6 text-red-600"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
							/>
						</svg>
					</div>
					<h3 className="text-lg font-medium">Error loading routine</h3>
					<p className="text-muted-foreground max-w-md mx-auto">
						{error.message ||
							"We couldn't load the routine data. Please check your connection and try again."}
					</p>
					<div className="flex justify-center gap-3 mt-4">
						<Button variant="outline" onClick={() => router.push('/routines')}>
							Back to Routines
						</Button>
						<Button onClick={() => router.refresh()}>Try Again</Button>
					</div>
				</div>
			)
		}

		switch (currentStep) {
			case 1:
				return (
					<RoutineBasicInfo data={routineData} onUpdate={updateRoutineData} />
				)
			case 2:
				return (
					<TrainingDays
						data={routineData}
						onUpdate={updateRoutineData}
						isEditing
					/>
				)
			case 3:
				return (
					<BuildDays
						data={routineData}
						onUpdate={updateRoutineData}
						isEditing
					/>
				)
			case 4:
				// Step 4 is either RtF Configuration (if RtF exercises exist) or Review
				if (hasRtfExercises) {
					return (
						<RtfConfiguration data={routineData} onUpdate={updateRoutineData} />
					)
				}
				return (
					<ReviewAndCreate
						data={routineData}
						routineId={routineId}
						isEditing={true}
						onComplete={() => {
							router.push('/routines')
						}}
					/>
				)
			case 5:
				// Step 5 is Review when RtF exercises exist
				return (
					<ReviewAndCreate
						data={routineData}
						routineId={routineId}
						isEditing={true}
						onComplete={() => {
							router.push('/routines')
						}}
					/>
				)
			default:
				return null
		}
	}

	const isFirstStep = currentStep === 1
	const isSubmitting =
		createRoutineMutation.isPending || updateRoutineMutation.isPending

	return (
		<div className="container max-w-3xl mx-auto py-8">
			{/* Classical Hero */}
			<HeroSection
				imageSrc="/backgrounds/vertical-hero-greek-columns.webp"
				sectionClassName="mb-4 sm:mb-6"
				title={<>Refine Your Program</>}
				subtitle={<>Adjust days, progressions, and details.</>}
			/>
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center gap-4 mb-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={handleCancel}
						className="flex items-center gap-2"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Routines
					</Button>
				</div>
				<h1 className="text-3xl font-bold">Edit Routine</h1>
				<p className="text-muted-foreground mt-2">
					Update your workout routine step by step
				</p>
			</div>

			{/* Stepper: sticky on top for easier navigation on mobile */}
			<div className="sticky top-0 z-20 mb-4 sm:mb-8 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="py-2">
					<Stepper
						steps={STEPS}
						currentStep={currentStep}
						onStepClick={handleStepClick}
						visitedSteps={visitedSteps}
						// Allow clicking directly to any step whose previous steps are valid (edit flow)
						canStepClick={id =>
							arePreviousStepsValid(id) || visitedSteps.has(id)
						}
						// Render completed state based on data validity (not only position)
						completedSteps={
							new Set(
								[1, 2, 3, 4].filter(id => id < currentStep && isStepValid(id)),
							)
						}
					/>
				</div>
			</div>

			{/* Main Content */}
			<Card className="overflow-hidden">
				<CardHeader className="border-b">
					<CardTitle className="text-lg sm:text-xl">
						{STEPS[currentStep - 1].title}
					</CardTitle>
					<CardDescription className="hidden sm:block">
						{STEPS[currentStep - 1].description}
					</CardDescription>
				</CardHeader>
				<CardContent className="p-6">{renderCurrentStep()}</CardContent>
			</Card>

			{/* Navigation */}
			<WizardNavigation
				currentStep={currentStep}
				totalSteps={STEPS.length}
				onPrevious={handlePrevious}
				onNext={handleNext}
				isPreviousDisabled={isFirstStep}
				isNextDisabled={!canProceedToNextStep()}
				isSubmitting={isSubmitting}
			/>
		</div>
	)
}
