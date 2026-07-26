'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
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

// Step components. Steps 1-2 are static: the user always sees step 1 first and
// step 2 immediately after. Steps 3-4 are the heavy ones and are loaded on
// demand — there is no reason to ship them before the user has even named the
// routine. See TD-09.
import { RoutineBasicInfo } from '@/features/routines/wizard/RoutineBasicInfo'
import { TrainingDays } from '@/features/routines/wizard/TrainingDays'
import { RoutineWizardData } from '@/features/routines/wizard/types'
import { WizardNavigation } from '@/features/routines/wizard/WizardNavigation'
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

const STEPS = [
	{ id: 1, title: 'Basic Info', description: 'Name and description' },
	{ id: 2, title: 'Training Days', description: 'Select workout days' },
	{ id: 3, title: 'Build Days', description: 'Add exercises and sets' },
	{ id: 4, title: 'Review & Create', description: 'Review and save routine' },
]

export default function CreateRoutinePage() {
	const router = useRouter()
	const [currentStep, setCurrentStep] = useState(1)
	const [visitedSteps, setVisitedSteps] = useState(new Set([1])) // Track visited steps
	const [routineData, setRoutineData] = useState<RoutineWizardData>({
		name: '',
		description: '',
		trainingDays: [],
		days: [],
	})

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
		// Allow navigation to any previously visited step
		if (visitedSteps.has(stepId)) {
			setCurrentStep(stepId)
		}
	}

	const canProceedToNextStep = () => {
		switch (currentStep) {
			case 1: // Basic Info
				return routineData.name.trim() !== ''
			case 2: // Training Days
				return routineData.trainingDays.length > 0
			case 3: // Build Days
				return routineData.days.every(day => day.exercises.length > 0)
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
		<div className="container mx-auto py-8">
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
