'use client'

import {
	BAR_CHOICES_KG,
	DEFAULT_WEEK_STARTS_ON,
	EXERCISE_EQUIPMENT,
	type ExerciseEquipment,
	isWeekStartsOn,
	type LengthUnit,
	PLATE_SETS,
	PROFILE_TRAINING_GOALS_MAX,
	TRAINING_EXPERIENCE_LEVEL_VALUES,
	TRAINING_GOAL_VALUES,
	type TrainingExperienceLevel,
	type TrainingGoal,
	type UserProfile,
	type WeekStartsOn,
	type WeightUnit,
} from '@sunsteel/contracts'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { daysOfWeekInOrder } from '@/features/routines/wizard/constants/training-days'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import type { Locale } from '@/i18n/config'
import { intlLocale } from '@/i18n/date-locale'
import { useMeasurableGoals } from '@/lib/api/hooks/useMeasurableGoals'
import { useAddMeasurableGoal } from '@/lib/api/hooks/useOnboarding'
import {
	useChangeTimeZone,
	useUpdateWeekStart,
} from '@/lib/api/hooks/useRegionalPreferences'
import {
	useReplaceTrainingLocations,
	useTrainingLocations,
} from '@/lib/api/hooks/useTrainingLocations'
import { useUpdateUser } from '@/lib/api/hooks/useUpdateUser'
import { useWorkoutAnalytics } from '@/lib/api/hooks/useWorkoutAnalytics'
import {
	type OnboardingRecommendation,
	recommendationHref,
	recommendStart,
} from '@/lib/onboarding/steps'
import { weekdayName } from '@/lib/utils/date'
import { equipmentLabel } from '@/lib/utils/exercise-equipment'
import {
	deviceTimeZone,
	knownTimeZones,
	orderTimeZones,
	timeZoneLabel,
	zonesDiffer,
} from '@/lib/utils/regional'
import {
	findRoutineTemplate,
	templateText,
} from '@/lib/utils/routine-templates'
import {
	getTrainingExperienceLabel,
	getTrainingGoalLabel,
} from '@/lib/utils/training-identity'
import { formatWeight } from '@/lib/utils/weight-unit'

/**
 * ONBOARD-01: one screen per registry step. Each saves through the write the
 * app already uses for that preference and then hands on; Skip hands on
 * without saving. The frame holds the screen's one filled action.
 */
export function StepFrame({
	title,
	description,
	children,
	onContinue,
	onSkip,
	pending = false,
	continueLabel,
}: {
	title: string
	description: string
	children: React.ReactNode
	onContinue: () => void
	onSkip: () => void
	pending?: boolean
	continueLabel?: string
}) {
	const t = useTranslations('onboarding.page')
	return (
		<section aria-labelledby="onboarding-step-heading" className="space-y-6">
			<div className="rule-heading space-y-1 pb-3">
				<h2
					id="onboarding-step-heading"
					className="type-section text-foreground"
				>
					{title}
				</h2>
				<p className="type-body-sm max-w-[68ch] text-ink-3">{description}</p>
			</div>
			<div className="space-y-5">{children}</div>
			<div className="flex flex-wrap items-center gap-3 pt-2">
				<Button type="button" onClick={onContinue} disabled={pending}>
					{pending ? (
						<Loader2 className="size-4 animate-spin" aria-hidden />
					) : null}
					{pending ? t('saving') : (continueLabel ?? t('continue'))}
				</Button>
				<Button
					type="button"
					variant="ghost"
					onClick={onSkip}
					disabled={pending}
				>
					{t('skip')}
				</Button>
			</div>
		</section>
	)
}

function useSaveFailed() {
	const t = useTranslations('onboarding.page')
	const errorText = useApiErrorMessage()
	const { push } = useToast()
	return (error: unknown) =>
		push({
			title: t('saveFailed'),
			description: errorText(error as Error),
			variant: 'destructive',
		})
}

interface StepProps {
	profile: UserProfile
	onDone: () => void
}

export function UnitsStep({ profile, onDone }: StepProps) {
	const t = useTranslations('onboarding.steps.units')
	const locale = useLocale() as Locale
	const baseId = useId()
	const failed = useSaveFailed()
	const analytics = useWorkoutAnalytics()
	const updateUser = useUpdateUser()
	const updateWeek = useUpdateWeekStart()
	const changeZone = useChangeTimeZone()
	const device = deviceTimeZone()
	const account =
		analytics.data?.requestedTimeZone ?? profile.timeZone ?? device ?? null
	const storedWeek: WeekStartsOn = isWeekStartsOn(profile.weekStartsOn)
		? profile.weekStartsOn
		: DEFAULT_WEEK_STARTS_ON
	const [weightUnit, setWeightUnit] = useState<WeightUnit>(profile.weightUnit)
	const [lengthUnit, setLengthUnit] = useState<LengthUnit>(
		profile.lengthUnit ?? 'CM',
	)
	const [zone, setZone] = useState(account ?? '')
	const [weekStart, setWeekStart] = useState<WeekStartsOn>(storedWeek)
	const zones = useMemo(
		() => orderTimeZones(knownTimeZones(account, device), account, device),
		[account, device],
	)
	const pending =
		updateUser.isPending || updateWeek.isPending || changeZone.isPending

	const save = async () => {
		try {
			if (
				weightUnit !== profile.weightUnit ||
				lengthUnit !== (profile.lengthUnit ?? 'CM')
			) {
				await updateUser.mutateAsync({ weightUnit, lengthUnit })
			}
			if (weekStart !== storedWeek) await updateWeek.mutateAsync(weekStart)
			if (zone && account && zonesDiffer(zone, account)) {
				await changeZone.mutateAsync(zone)
			}
			onDone()
		} catch (error) {
			failed(error)
		}
	}

	return (
		<StepFrame
			title={t('title')}
			description={t('description')}
			onContinue={() => void save()}
			onSkip={onDone}
			pending={pending}
		>
			<div className="grid gap-5 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor={`${baseId}-weight`}>{t('weightUnit')}</Label>
					<NativeSelect
						id={`${baseId}-weight`}
						value={weightUnit}
						onChange={event => setWeightUnit(event.target.value as WeightUnit)}
					>
						<option value="KG">{t('kilograms')}</option>
						<option value="LB">{t('pounds')}</option>
					</NativeSelect>
				</div>
				<div className="space-y-2">
					<Label htmlFor={`${baseId}-length`}>{t('lengthUnit')}</Label>
					<NativeSelect
						id={`${baseId}-length`}
						value={lengthUnit}
						onChange={event => setLengthUnit(event.target.value as LengthUnit)}
					>
						<option value="CM">{t('centimeters')}</option>
						<option value="IN">{t('inches')}</option>
					</NativeSelect>
				</div>
				<div className="space-y-2">
					<Label htmlFor={`${baseId}-zone`}>{t('timeZone')}</Label>
					<NativeSelect
						id={`${baseId}-zone`}
						value={zone}
						onChange={event => setZone(event.target.value)}
					>
						{zones.map(item => (
							<option key={item} value={item}>
								{timeZoneLabel(item, locale)}
							</option>
						))}
					</NativeSelect>
				</div>
				<div className="space-y-2">
					<Label htmlFor={`${baseId}-week`}>{t('weekStart')}</Label>
					<NativeSelect
						id={`${baseId}-week`}
						value={String(weekStart)}
						onChange={event =>
							setWeekStart(Number(event.target.value) as WeekStartsOn)
						}
					>
						<option value="1">{t('monday')}</option>
						<option value="0">{t('sunday')}</option>
					</NativeSelect>
				</div>
			</div>
		</StepFrame>
	)
}

export function GoalsStep({ profile, onDone }: StepProps) {
	const t = useTranslations('onboarding.steps.goals')
	const tIdentity = useTranslations('routines.identity')
	const baseId = useId()
	const failed = useSaveFailed()
	const updateUser = useUpdateUser()
	const [goals, setGoals] = useState<TrainingGoal[]>(
		profile.trainingIdentity?.goals ?? [],
	)
	const [experience, setExperience] = useState<TrainingExperienceLevel | null>(
		profile.trainingIdentity?.experienceLevel ?? null,
	)
	const full = goals.length >= PROFILE_TRAINING_GOALS_MAX

	const toggle = (goal: TrainingGoal, checked: boolean) =>
		setGoals(current =>
			checked
				? current.includes(goal)
					? current
					: [...current, goal]
				: current.filter(item => item !== goal),
		)

	const save = async () => {
		try {
			await updateUser.mutateAsync({
				trainingGoals: goals,
				trainingExperienceLevel: experience,
			})
			onDone()
		} catch (error) {
			failed(error)
		}
	}

	return (
		<StepFrame
			title={t('title')}
			description={t('description')}
			onContinue={() => void save()}
			onSkip={onDone}
			pending={updateUser.isPending}
		>
			<fieldset className="space-y-3">
				<legend className="type-body-sm text-ink-3">
					{t('goalsLabel', { max: PROFILE_TRAINING_GOALS_MAX })}
				</legend>
				<div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
					{TRAINING_GOAL_VALUES.map(goal => {
						const id = `${baseId}-goal-${goal}`
						const checked = goals.includes(goal)
						return (
							<div key={goal} className="flex items-center gap-3">
								<Checkbox
									id={id}
									checked={checked}
									disabled={!checked && full}
									onCheckedChange={value => toggle(goal, value === true)}
								/>
								<Label htmlFor={id} className="type-body text-foreground">
									{getTrainingGoalLabel(goal, tIdentity)}
								</Label>
							</div>
						)
					})}
				</div>
			</fieldset>
			<div className="max-w-sm space-y-2">
				<Label htmlFor={`${baseId}-experience`}>{t('experienceLabel')}</Label>
				<NativeSelect
					id={`${baseId}-experience`}
					value={experience ?? ''}
					onChange={event =>
						setExperience(
							(event.target.value || null) as TrainingExperienceLevel | null,
						)
					}
				>
					<option value="">{t('notSpecified')}</option>
					{TRAINING_EXPERIENCE_LEVEL_VALUES.map(level => (
						<option key={level} value={level}>
							{getTrainingExperienceLabel(level, tIdentity)}
						</option>
					))}
				</NativeSelect>
			</div>
		</StepFrame>
	)
}

export function DaysStep({
	weekStartsOn,
	days,
	onChange,
	onDone,
}: {
	weekStartsOn: WeekStartsOn
	days: number[]
	onChange: (days: number[]) => void
	onDone: () => void
}) {
	const t = useTranslations('onboarding.steps.days')
	const tDate = useTranslations('routines.date')
	const baseId = useId()
	return (
		<StepFrame
			title={t('title')}
			description={t('description')}
			onContinue={onDone}
			onSkip={() => {
				onChange([])
				onDone()
			}}
		>
			<fieldset className="space-y-3">
				<legend className="type-body-sm text-ink-3">{t('label')}</legend>
				<div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
					{daysOfWeekInOrder(weekStartsOn).map(({ id: day }) => {
						const id = `${baseId}-day-${day}`
						const checked = days.includes(day)
						return (
							<div key={day} className="flex items-center gap-3">
								<Checkbox
									id={id}
									checked={checked}
									onCheckedChange={value =>
										onChange(
											value === true
												? [...days, day]
												: days.filter(item => item !== day),
										)
									}
								/>
								<Label htmlFor={id} className="type-body text-foreground">
									{weekdayName(day, 'long', tDate)}
								</Label>
							</div>
						)
					})}
				</div>
				<p role="status" className="type-body-sm text-ink-2">
					{t('count', { count: days.length })}
				</p>
			</fieldset>
		</StepFrame>
	)
}

type Place = 'commercial' | 'home' | 'none'
type PlateSet = 'STANDARD' | 'LIGHT'
const LISTABLE: ExerciseEquipment[] = EXERCISE_EQUIPMENT.filter(
	item => item !== 'bodyweight',
)
const HOME_DEFAULT: ExerciseEquipment[] = [
	'barbell',
	'dumbbell',
	'bench',
	'rack',
]

export function EquipmentStep({ profile, onDone }: StepProps) {
	const t = useTranslations('onboarding.steps.equipment')
	const tPage = useTranslations('onboarding.page')
	const tEquipment = useTranslations('routines.equipment')
	const locale = useLocale() as Locale
	const baseId = useId()
	const failed = useSaveFailed()
	const locations = useTrainingLocations()
	const replace = useReplaceTrainingLocations()
	const unit = profile.weightUnit
	const [place, setPlace] = useState<Place>('commercial')
	const [equipment, setEquipment] = useState<ExerciseEquipment[]>(HOME_DEFAULT)
	const [bar, setBar] = useState(BAR_CHOICES_KG[unit][0])
	const [plates, setPlates] = useState<PlateSet>('STANDARD')
	const existing = locations.data?.length ?? 0

	const save = async () => {
		if (existing > 0 || place === 'none') return onDone()
		try {
			await replace.mutateAsync({
				locations: [
					{
						name: place === 'home' ? t('homeName') : t('gymName'),
						isDefault: true,
						barWeightKg: place === 'home' ? bar : BAR_CHOICES_KG[unit][0],
						availablePlatePairs:
							PLATE_SETS[unit][place === 'home' ? plates : 'STANDARD'],
						equipment: place === 'home' ? equipment : LISTABLE,
					},
				],
			})
			onDone()
		} catch (error) {
			failed(error)
		}
	}

	return (
		<StepFrame
			title={t('title')}
			description={t('description')}
			onContinue={() => void save()}
			onSkip={onDone}
			pending={replace.isPending}
		>
			{locations.isPending ? (
				<Skeleton className="h-24" aria-label={tPage('loading')} />
			) : existing > 0 ? (
				<p className="type-body text-ink-2">
					{t.rich('already', {
						count: existing,
						link: chunks => (
							<Link
								href="/settings/training"
								className="underline underline-offset-4"
							>
								{chunks}
							</Link>
						),
					})}
				</p>
			) : (
				<>
					<div className="max-w-sm space-y-2">
						<Label htmlFor={`${baseId}-place`}>{t('where')}</Label>
						<NativeSelect
							id={`${baseId}-place`}
							value={place}
							onChange={event => setPlace(event.target.value as Place)}
						>
							<option value="commercial">{t('commercial')}</option>
							<option value="home">{t('home')}</option>
							<option value="none">{t('none')}</option>
						</NativeSelect>
					</div>
					{place === 'none' ? (
						<p className="type-body-sm max-w-[68ch] text-ink-3">
							{t('noneNote')}
						</p>
					) : null}
					{place === 'home' ? (
						<>
							<fieldset className="space-y-3">
								<legend className="type-body-sm text-ink-3">
									{t('homeEquipment')}
								</legend>
								<div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
									{LISTABLE.map(item => {
										const id = `${baseId}-eq-${item}`
										return (
											<div key={item} className="flex items-center gap-3">
												<Checkbox
													id={id}
													checked={equipment.includes(item)}
													onCheckedChange={value =>
														setEquipment(current =>
															value === true
																? [...current, item]
																: current.filter(entry => entry !== item),
														)
													}
												/>
												<Label
													htmlFor={id}
													className="type-body text-foreground"
												>
													{equipmentLabel(item, tEquipment)}
												</Label>
											</div>
										)
									})}
								</div>
							</fieldset>
							<div className="grid max-w-xl gap-5 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor={`${baseId}-bar`}>{t('bar')}</Label>
									<NativeSelect
										id={`${baseId}-bar`}
										value={String(bar)}
										onChange={event => setBar(Number(event.target.value))}
									>
										{BAR_CHOICES_KG[unit].map(kg => (
											<option key={kg} value={String(kg)}>
												{formatWeight(kg, unit, locale)}
											</option>
										))}
									</NativeSelect>
								</div>
								<div className="space-y-2">
									<Label htmlFor={`${baseId}-plates`}>{t('plates')}</Label>
									<NativeSelect
										id={`${baseId}-plates`}
										value={plates}
										onChange={event =>
											setPlates(event.target.value as PlateSet)
										}
									>
										<option value="STANDARD">{t('platesStandard')}</option>
										<option value="LIGHT">{t('platesLight')}</option>
									</NativeSelect>
								</div>
							</div>
						</>
					) : null}
				</>
			)}
		</StepFrame>
	)
}

export function TargetStep({
	days,
	onDone,
}: {
	days: number[]
	onDone: () => void
}) {
	const t = useTranslations('onboarding.steps.target')
	const tPage = useTranslations('onboarding.page')
	const baseId = useId()
	const failed = useSaveFailed()
	const goals = useMeasurableGoals()
	const add = useAddMeasurableGoal()
	const [wanted, setWanted] = useState(true)
	const held =
		goals.data?.some(goal => goal.type === 'WEEKLY_SESSIONS') ?? false
	const count = Math.min(14, days.length)

	const save = async () => {
		if (held || count === 0 || !wanted) return onDone()
		try {
			await add.mutateAsync({
				type: 'WEEKLY_SESSIONS',
				targetValue: count,
				direction: 'AT_LEAST',
			})
			onDone()
		} catch (error) {
			failed(error)
		}
	}

	return (
		<StepFrame
			title={t('title')}
			description={t('description')}
			onContinue={() => void save()}
			onSkip={onDone}
			pending={add.isPending}
		>
			{goals.isPending ? (
				<Skeleton className="h-10" aria-label={tPage('loading')} />
			) : held ? (
				<p className="type-body text-ink-2">{t('already')}</p>
			) : count === 0 ? (
				<p className="type-body text-ink-2">{t('noDays')}</p>
			) : (
				<div className="flex items-center gap-3">
					<Checkbox
						id={`${baseId}-target`}
						checked={wanted}
						onCheckedChange={value => setWanted(value === true)}
					/>
					<Label
						htmlFor={`${baseId}-target`}
						className="type-body text-foreground"
					>
						{t('offer', { count })}
					</Label>
				</div>
			)}
		</StepFrame>
	)
}

export function RecommendationStep({
	profile,
	days,
	onComplete,
}: {
	profile: UserProfile
	days: number[]
	onComplete: () => void
}) {
	const t = useTranslations('onboarding.steps.recommendation')
	const tTemplates = useTranslations('routines.templates')
	const tDate = useTranslations('routines.date')
	const locale = useLocale() as Locale
	const recommendation: OnboardingRecommendation = recommendStart({
		goals: profile.trainingIdentity?.goals ?? [],
		experience: profile.trainingIdentity?.experienceLevel ?? null,
		weekdays: days,
	})
	const template =
		recommendation.kind === 'template'
			? findRoutineTemplate(recommendation.slug)
			: null
	const text = template ? templateText(template, tTemplates) : null
	const href = recommendationHref(recommendation)
	// In a sentence: "lunes, martes y jueves", never capitalised mid-sentence
	// in Spanish, and joined the way the language joins a list.
	const weekdayList = (weekdays: number[]) =>
		new Intl.ListFormat(intlLocale(locale), { type: 'conjunction' }).format(
			weekdays.map(day => {
				const name = weekdayName(day, 'long', tDate)
				return locale === 'es' ? name.toLocaleLowerCase('es') : name
			}),
		)

	return (
		<section aria-labelledby="onboarding-step-heading" className="space-y-6">
			<div className="rule-heading space-y-1 pb-3">
				<h2
					id="onboarding-step-heading"
					className="type-section text-foreground"
				>
					{t('title')}
				</h2>
			</div>
			{template && text && recommendation.kind === 'template' ? (
				<div className="space-y-2">
					<p className="type-body-sm text-ink-3">{t('intro')}</p>
					<h3 className="type-panel text-foreground">{text.name}</h3>
					<p className="type-body max-w-[68ch] text-ink-2">{text.summary}</p>
					<p className="type-body-sm max-w-[68ch] text-ink-3">
						{t('reason', {
							count: new Set(days).size,
							beginner:
								profile.trainingIdentity?.experienceLevel === 'BEGINNER'
									? 'yes'
									: 'no',
						})}{' '}
						{recommendation.weekdays?.length
							? t('onYourDays', {
									days: weekdayList(recommendation.weekdays),
								})
							: days.length
								? t('ownDays')
								: null}
					</p>
				</div>
			) : (
				<p className="type-body max-w-[68ch] text-ink-2">{t('buildIntro')}</p>
			)}
			<div className="flex flex-wrap items-center gap-3 pt-2">
				<Button asChild>
					<Link href={href} onClick={onComplete}>
						{recommendation.kind === 'template' ? t('open') : t('build')}
					</Link>
				</Button>
				{recommendation.kind === 'template' ? (
					<Button asChild variant="outline">
						<Link href="/routines/new" onClick={onComplete}>
							{t('other')}
						</Link>
					</Button>
				) : null}
				<Button asChild variant="ghost">
					<Link href="/dashboard" onClick={onComplete}>
						{t('later')}
					</Link>
				</Button>
			</div>
		</section>
	)
}
