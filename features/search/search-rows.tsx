'use client'

import type {
	Exercise,
	Routine,
	SharedRoutineSearchResult,
	UserSearchResponse,
	WorkoutSessionSummary,
} from '@sunsteel/contracts'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import {
	isArchivedExercise,
	isCustomExercise,
} from '@/lib/utils/custom-exercises'
import { getFriendlyMuscleNames } from '@/lib/utils/muscle-groups'
import { memberHref, sharedRoutineHref, workoutHref } from '@/lib/utils/search'

/**
 * NAV-01 result rows. Each is a §11.5 ruled row whose whole text is one link
 * (navigation, §11.12: no field affordance, no filled control), with the
 * name on the first line and one quiet caption under it.
 */
function ResultRow({
	href,
	title,
	caption,
	leading,
}: {
	href: string
	title: ReactNode
	caption?: ReactNode
	leading?: ReactNode
}) {
	return (
		<li className="rule-row">
			<Link
				href={href}
				className="group flex min-w-0 items-center gap-3 rounded-sm py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
			>
				{leading}
				<span className="min-w-0">
					<span className="type-panel block break-words text-foreground underline-offset-4 group-hover:underline">
						{title}
					</span>
					{caption ? (
						<span className="type-body-sm block text-ink-3">{caption}</span>
					) : null}
				</span>
			</Link>
		</li>
	)
}

export function MemberResultRow({ member }: { member: UserSearchResponse }) {
	const fullName = [member.name, member.lastName].filter(Boolean).join(' ')
	return (
		<ResultRow
			href={memberHref(member.username)}
			title={fullName}
			caption={`@${member.username}`}
			leading={
				<Avatar className="h-10 w-10 shrink-0 border border-rule">
					<AvatarImage
						src={member.avatarUrl || ''}
						alt=""
						className="object-cover"
					/>
					<AvatarFallback className="type-data bg-surface-sunk text-ink-2">
						{member.name.charAt(0)}
						{member.lastName?.charAt(0)}
					</AvatarFallback>
				</Avatar>
			}
		/>
	)
}

export function ExerciseResultRow({ exercise }: { exercise: Exercise }) {
	const tExercises = useTranslations('catalog.exercises')
	const tUi = useTranslations('catalog.exercisesUi')
	const tMuscles = useTranslations('routines.muscles')
	const muscles = getFriendlyMuscleNames(
		exercise.primaryMuscles,
		tMuscles,
	).join(', ')
	const parts = [
		isCustomExercise(exercise)
			? tUi('yoursRow', {
					archived: isArchivedExercise(exercise) ? 'yes' : 'no',
				})
			: null,
		muscles || null,
	].filter(Boolean)
	return (
		<ResultRow
			href={`/exercises/${exercise.id}`}
			title={exerciseLabel(exercise.name, tExercises)}
			caption={parts.join(' · ') || undefined}
		/>
	)
}

function baselineSize(routine: Routine) {
	return {
		days: routine.days.length,
		exercises: routine.days.reduce(
			(total, day) => total + day.exercises.length,
			0,
		),
	}
}

export function OwnRoutineResultRow({ routine }: { routine: Routine }) {
	const t = useTranslations('social.search')
	const size = t('routineSize', baselineSize(routine))
	return (
		<ResultRow
			href={`/routines/${routine.id}`}
			title={routine.name}
			caption={routine.isCompleted ? `${t('archivedRoutine')} · ${size}` : size}
		/>
	)
}

export function SharedRoutineResultRow({
	routine,
}: {
	routine: SharedRoutineSearchResult
}) {
	const t = useTranslations('social.search')
	const author = [routine.author.name, routine.author.lastName]
		.filter(Boolean)
		.join(' ')
	return (
		<ResultRow
			href={sharedRoutineHref(routine.author.username, routine.routineId)}
			title={routine.name}
			caption={`${t('byAuthor', { name: author })} · ${t('routineSize', {
				days: routine.dayCount,
				exercises: routine.exerciseCount,
			})}`}
		/>
	)
}

const STATUS_KEYS = {
	COMPLETED: 'statusCompleted',
	ABORTED: 'statusAborted',
	IN_PROGRESS: 'statusInProgress',
} as const

export function WorkoutResultRow({
	session,
}: {
	session: WorkoutSessionSummary
}) {
	const t = useTranslations('social.search')
	const tMetrics = useTranslations('workout.metrics')
	const locale = useLocale() as Locale
	const date = dateFormatter(locale, {
		dateStyle: 'medium',
	}).format(new Date(session.startedAt))
	const status = tMetrics(
		STATUS_KEYS[session.status as keyof typeof STATUS_KEYS] ?? 'statusUnknown',
	)
	return (
		<ResultRow
			href={workoutHref(session)}
			title={
				session.routine.dayName
					? `${session.routine.name} · ${session.routine.dayName}`
					: session.routine.name
			}
			caption={
				<>
					{t('workoutLine', { date, status })}
					{session.notes ? (
						<span className="mt-0.5 line-clamp-2 block text-ink-3">
							{session.notes}
						</span>
					) : null}
				</>
			}
		/>
	)
}

export function ResultRowsLoading({ rows = 3 }: { rows?: number }) {
	const t = useTranslations('social.search')
	return (
		<ul aria-busy="true" aria-label={t('loading')}>
			{Array.from({ length: rows }).map((_, index) => (
				<li key={index} className="rule-row space-y-2 py-3">
					<Skeleton className="h-4 w-48 max-w-full" />
					<Skeleton className="h-3 w-28" />
				</li>
			))}
		</ul>
	)
}
