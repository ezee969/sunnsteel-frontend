'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { RoutineWizardData } from '@/features/routines/wizard/types'
import { getWeekdayFromIsoDate } from '@/features/routines/wizard/utils/date-helpers'
import { WizardNavigation } from '@/features/routines/wizard/WizardNavigation'

// Use shared RoutineWizardData type

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
	title: 'Review & Create',
	description: 'Review and save routine',
}
const REVIEW_STEP_WITH_RTF = {
	id: 5,
	title: 'Review & Create',
	description: 'Review and save routine',
}

export default function CreateRoutinePage() {
	const router = useRouter()
	const [currentStep, setCurrentStep] = useState(1)
	const [visitedSteps, setVisitedSteps] = useState(new Set([1])) // Track visited steps
	const [routineData, setRoutineData] = useState<RoutineWizardData>({
		name: '',
		description: '',
		trainingDays: [],
		days: [],
		programScheduleMode: 'NONE',
		programWithDeloads: true,
	})

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

	const updateRoutineData = (updates: Partial<RoutineWizardData>) => {
		setRoutineData(prev => ({ ...prev, ...updates }))
	}

	// Handle step adjustment when RtF exercises are added/removed
	useEffect(() => {
		// If we're on step 4 (RtF config) and RtF exercises were removed, skip to review
		if (currentStep === 4 && !hasRtfExercises) {
			// User is on what was RtF config, but no RtF exercises exist anymore
			// This means step 4 is now Review, so we're already on the right step
			// No action needed - the renderCurrentStep will show Review
		}
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
		// Allow navigation to any previously visited step
		if (visitedSteps.has(stepId)) {
			setCurrentStep(stepId)
		}
	}

	const canProceedToNextStep = () => {
		switch (currentStep) {
			case 1: // Basic Info
				const hasName = routineData.name.trim() !== ''
				if (!hasName) return false

				// If Timeframe is selected and RtF is present, require program start date and timezone
				if (routineData.programScheduleMode === 'TIMEFRAME') {
					const usesRtf = routineData.days.some(d =>
						d.exercises.some(
							ex =>
								ex.progressionScheme === 'PROGRAMMED_RTF' ||
								ex.progressionScheme === 'PROGRAMMED_RTF_HYPERTROPHY',
						),
					)
					if (usesRtf) {
						const hasDate =
							!!routineData.programStartDate &&
							routineData.programStartDate.trim() !== ''
						const hasTz = !!(
							routineData.programTimezone &&
							routineData.programTimezone.trim() !== ''
						)
						return hasDate && hasTz
					}
				}

				return true
			case 2: // Training Days
				if (routineData.trainingDays.length === 0) return false
				// If TIMEFRAME + RtF, enforce weekday alignment with earliest training day
				if (routineData.programScheduleMode === 'TIMEFRAME') {
					const usesRtf = routineData.days.some(d =>
						d.exercises.some(
							ex =>
								ex.progressionScheme === 'PROGRAMMED_RTF' ||
								ex.progressionScheme === 'PROGRAMMED_RTF_HYPERTROPHY',
						),
					)
					if (usesRtf && routineData.programStartDate) {
						const startDow = getWeekdayFromIsoDate(routineData.programStartDate)
						if (startDow === null) return false
						const earliest = Math.min(...routineData.trainingDays)
						return (
							routineData.trainingDays.includes(startDow) &&
							earliest === startDow
						)
					}
				}
				return true
			case 3: {
				// Build Days
				const daysComplete = routineData.days.every(
					day => day.exercises.length > 0,
				)
				if (!daysComplete) return false
				// Gate on program fields when schedule is TIMEFRAME and RtF is used
				const usesRtf = routineData.days.some(d =>
					d.exercises.some(
						ex =>
							ex.progressionScheme === 'PROGRAMMED_RTF' ||
							ex.progressionScheme === 'PROGRAMMED_RTF_HYPERTROPHY',
					),
				)
				if (routineData.programScheduleMode === 'TIMEFRAME' && usesRtf) {
					const hasDate =
						!!routineData.programStartDate &&
						routineData.programStartDate.trim() !== ''
					const hasTz = !!(
						routineData.programTimezone &&
						routineData.programTimezone.trim() !== ''
					)
					if (!(hasDate && hasTz)) return false
					// Validate start week range if provided
					const totalWeeks = routineData.programWithDeloads ? 21 : 18
					const sw = routineData.programStartWeek ?? 1
					if (sw < 1 || sw > totalWeeks) return false
				}
				return true
			}
			default:
				return true
		}
	}

	const handleCancel = () => {
		router.push('/routines')
	}

	const renderCurrentStep = () => {
		switch (currentStep) {
			case 1:
				return (
					<RoutineBasicInfo data={routineData} onUpdate={updateRoutineData} />
				)
			case 2:
				return <TrainingDays data={routineData} onUpdate={updateRoutineData} />
			case 3:
				return <BuildDays data={routineData} onUpdate={updateRoutineData} />
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
						onComplete={() => {
							router.push('/routines')
						}}
					/>
				)
			default:
				return null
		}
	}

	return (
		<div className="container max-w-3xl mx-auto py-8">
			{/* Classical Hero */}
			<HeroSection
				imageSrc="/backgrounds/vertical-hero-greek-columns.webp"
				sectionClassName="mb-4 sm:mb-6"
				title={<>Design Your Program</>}
				subtitle={<>Build days, choose progression, set your path.</>}
			/>
			{/* Header */}
			<div className="mb-4 sm:mb-8">
				<div className="flex items-center gap-2 mb-2 sm:mb-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={handleCancel}
						className="flex items-center gap-2 p-2 sm:px-4"
					>
						<ArrowLeft className="h-4 w-4" />
						<span className="hidden sm:inline">Back to Routines</span>
					</Button>
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold">Create New Routine</h1>
				<p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
					Build your custom workout routine step by step
				</p>
			</div>

			<div className=" mb-4 sm:mb-8 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="py-2">
					<Stepper
						steps={STEPS}
						currentStep={currentStep}
						onStepClick={handleStepClick}
						visitedSteps={visitedSteps}
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

			{/* Sticky bottom navigation */}
			<WizardNavigation
				currentStep={currentStep}
				totalSteps={STEPS.length}
				onPrevious={handlePrevious}
				onNext={handleNext}
				isPreviousDisabled={currentStep === 1}
				isNextDisabled={!canProceedToNextStep()}
			/>
		</div>
	)
}
