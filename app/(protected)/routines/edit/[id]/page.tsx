'use client'

import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import HeroSection from '@/components/layout/HeroSection'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Stepper } from '@/components/ui/stepper'
// Step components — steps 3 and 4 are loaded on demand, see TD-09 and the
// matching comment in routines/new/page.tsx.
import { RoutineBasicInfo } from '@/features/routines/wizard/RoutineBasicInfo'
import { TrainingDays } from '@/features/routines/wizard/TrainingDays'
import {
	ProgressionScheme,
	RoutineWizardData,
} from '@/features/routines/wizard/types'
import { WizardStepSkeleton } from '@/features/routines/wizard/WizardStepSkeleton'

const BuildDays = dynamic(
	() => import('@/features/routines/wizard/BuildDays').then(m => m.BuildDays),
	{ loading: () => <WizardStepSkeleton />, ssr: false },
)

const ReviewAndCreate = dynamic(
	() =>
		import('@/features/routines/wizard/ReviewAndCreate').then(
			m => m.ReviewAndCreate,
		),
	{ loading: () => <WizardStepSkeleton />, ssr: false },
)
import { WizardNavigation } from '@/features/routines/wizard/WizardNavigation'
import { useCreateRoutine, useRoutine, useUpdateRoutine } from '@/lib/api/hooks'
import { RoutineDay, RoutineExercise } from '@/lib/api/types'

const STEPS = [
	{ id: 1, title: 'Basic Info', description: 'Name and description' },
	{ id: 2, title: 'Training Days', description: 'Select workout days' },
	{ id: 3, title: 'Build Days', description: 'Add exercises and sets' },
	{ id: 4, title: 'Review & Update', description: 'Review and save changes' },
]

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
						note: exercise.note ?? undefined,
						progressionScheme: mapProgressionScheme(
							(exercise as unknown as { progressionScheme?: string })
								.progressionScheme,
						),
						minWeightIncrement: exercise.minWeightIncrement || 2.5,
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
			}

			setRoutineData(transformedData)
		}
	}, [routine])

	const updateRoutineData = (updates: Partial<RoutineWizardData>) => {
		setRoutineData(prev => ({ ...prev, ...updates }))
	}

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

	const isStepValid = (stepId: number): boolean => {
		switch (stepId) {
			case 1:
				return routineData.name.trim() !== ''
			case 2:
				return routineData.trainingDays.length > 0
			case 3:
				return routineData.days.every(day => day.exercises.length > 0)
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
					<div className="h-12 w-12 animate-spin rounded-full border-2 border-rule-faint border-t-foreground"></div>
					<p className="type-body-sm text-ink-3">Loading routine data...</p>
				</div>
			)
		}

		if (error) {
			return (
				<div className="text-center py-12 space-y-4">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm border border-destructive bg-surface">
						<svg
							className="h-6 w-6 text-destructive"
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
				<h2 className="type-section text-foreground">Edit Routine</h2>
				<p className="type-body-sm mt-1 text-ink-3">
					Update your workout routine step by step
				</p>
			</div>

			{/* Stepper: sticky on top for easier navigation on mobile */}
			<div className="sticky top-0 z-20 mb-4 border-b border-rule bg-background sm:mb-8">
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
				<CardHeader className="border-b border-rule-faint pb-4">
					<CardTitle className="type-section text-foreground">
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
