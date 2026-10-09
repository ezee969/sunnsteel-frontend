'use client'

import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Suspense, useEffect, useMemo, useState } from 'react'

import HeroSection from '@/components/layout/HeroSection'
import { Button } from '@/components/ui/button'
import { Stepper } from '@/components/ui/stepper'
import { StarterTemplates } from '@/features/routines/components/StarterTemplates'
// Step components. Steps 1-2 are static: the user always sees step 1 first and
// step 2 immediately after. Steps 3-4 are the heavy ones and are loaded on
// demand — there is no reason to ship them before the user has even named the
// routine. See TD-09.
import { RoutineBasicInfo } from '@/features/routines/wizard/RoutineBasicInfo'
import { TrainingDays } from '@/features/routines/wizard/TrainingDays'
import { RoutineWizardData } from '@/features/routines/wizard/types'
import { WizardNavigation } from '@/features/routines/wizard/WizardNavigation'
import { WizardStepSkeleton } from '@/features/routines/wizard/WizardStepSkeleton'
import { useExercises } from '@/lib/api/hooks/useExercises'
import { catalogExercises } from '@/lib/utils/custom-exercises'
import {
	findRoutineTemplate,
	parseTemplateWeekdays,
	templateDraft,
} from '@/lib/utils/routine-templates'

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

const STEP_KEYS = [
	{
		id: 1,
		title: 'stepBasicInfoTitle',
		description: 'stepBasicInfoDescription',
	},
	{
		id: 2,
		title: 'stepTrainingDaysTitle',
		description: 'stepTrainingDaysDescription',
	},
	{
		id: 3,
		title: 'stepBuildDaysTitle',
		description: 'stepBuildDaysDescription',
	},
	{
		id: 4,
		title: 'stepReviewCreateTitle',
		description: 'stepReviewCreateDescription',
	},
] as const

const EMPTY_DRAFT: RoutineWizardData = {
	name: '',
	description: '',
	scheduleMode: 'WEEKLY',
	trainingDays: [],
	restDays: [],
	rotationWeekdays: [],
	days: [],
}

export default function CreateRoutinePage() {
	// `useSearchParams` needs a Suspense boundary in the App Router.
	return (
		<Suspense fallback={<WizardStepSkeleton />}>
			<CreateRoutineWizard />
		</Suspense>
	)
}

function CreateRoutineWizard() {
	const router = useRouter()
	const t = useTranslations('routines.builder')
	const STEPS = useMemo(
		() =>
			STEP_KEYS.map(step => ({
				id: step.id,
				title: t(step.title),
				description: t(step.description),
			})),
		[t],
	)

	const tTemplates = useTranslations('routines.templates')
	const [currentStep, setCurrentStep] = useState(1)
	const [visitedSteps, setVisitedSteps] = useState(new Set([1])) // Track visited steps
	const [routineData, setRoutineData] = useState<RoutineWizardData>(EMPTY_DRAFT)

	// ROUT-03: `?template=<slug>` opens a starter programme as the draft, once
	// the catalog it names exercises from has loaded. Choosing another template
	// replaces the draft; nothing is saved until the member creates it.
	const searchParams = useSearchParams()
	const templateSlug = searchParams.get('template')
	const template = findRoutineTemplate(templateSlug)
	// ONBOARD-01: the weekdays onboarding asked for, when it sent them.
	const templateWeekdays = useMemo(
		() => parseTemplateWeekdays(searchParams.get('days')),
		[searchParams],
	)
	const { data: catalog, isLoading: catalogLoading } = useExercises()
	const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null)
	const [missingExercises, setMissingExercises] = useState<string[]>([])
	useEffect(() => {
		if (!template || !catalog || appliedTemplate === template.slug) return
		// EXER-06: templates name catalog exercises, never a member's own.
		const result = templateDraft(
			template,
			catalogExercises(catalog),
			tTemplates,
			templateWeekdays,
		)
		setAppliedTemplate(template.slug)
		setCurrentStep(1)
		setVisitedSteps(new Set([1]))
		if (result.ok) {
			setMissingExercises([])
			setRoutineData(result.draft)
		} else {
			setMissingExercises(result.missing)
			setRoutineData(EMPTY_DRAFT)
		}
	}, [template, catalog, appliedTemplate, tTemplates, templateWeekdays])
	const templateLoading =
		!!template && appliedTemplate !== template.slug && catalogLoading

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
		if (templateLoading) return <WizardStepSkeleton />
		switch (currentStep) {
			case 1:
				return (
					<div className="space-y-8">
						{template && appliedTemplate === template.slug ? (
							missingExercises.length ? (
								<p role="status" className="type-body-sm text-ink-2">
									{tTemplates('couldNotOpen', {
										template: tTemplates(`${template.key}.name`),
										missing: missingExercises.join(', '),
									})}
								</p>
							) : (
								<p role="status" className="type-body-sm text-ink-2">
									{tTemplates('startedFrom', {
										template: tTemplates(`${template.key}.name`),
									})}
								</p>
							)
						) : null}
						<RoutineBasicInfo data={routineData} onUpdate={updateRoutineData} />
						{!template || missingExercises.length ? (
							<div className="rule-row pt-6">
								<StarterTemplates />
							</div>
						) : null}
					</div>
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
		<div className="container mx-auto sm:py-8">
			{/* Classical Hero */}
			<HeroSection
				sectionClassName="mb-4 sm:mb-6"
				title={<>{t('designTitle')}</>}
				subtitle={<>{t('designSubtitle')}</>}
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
						<ArrowLeft aria-hidden className="h-4 w-4" />
						<span className="hidden sm:inline">{t('backToRoutines')}</span>
					</Button>
				</div>
			</div>

			<div className="mb-4 border-b border-rule bg-background sm:mb-8">
				<div className="py-2">
					<Stepper
						steps={STEPS}
						currentStep={currentStep}
						onStepClick={handleStepClick}
						visitedSteps={visitedSteps}
					/>
				</div>
			</div>

			{/* UX-25 (§28.3): the step body is a ruled region, not a panel. The
			    stepper above names the step, so its title here is for screen
			    readers only; the boxes inside it are the exercises, the unit of
			    work. It was a panel holding a day panel holding exercise panels. */}
			<section aria-labelledby="wizard-step-title">
				<h2 id="wizard-step-title" className="sr-only">
					{STEPS[currentStep - 1].title}
				</h2>
				<p className="type-body-sm mb-4 hidden text-ink-3 sm:block">
					{STEPS[currentStep - 1].description}
				</p>
				{renderCurrentStep()}
			</section>

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
