'use client'

import {
	routineDayLabel,
	type RoutineSet,
	type SharedRoutine,
} from '@sunsteel/contracts'
import { exerciseGroupLabel, exerciseGroupPosition } from '@sunsteel/contracts'
import { useLocale, useTranslations } from 'next-intl'

import { Explanation } from '@/components/layout/explanation'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import {
	lpSharedSetLabel,
	lpSharedTableNote,
} from '@/lib/utils/routine-progression'
import {
	countSharedExercises,
	describeSharedRoutineOwner,
	sharedRoutineNote,
} from '@/lib/utils/routine-sharing'
import { setKindLabel } from '@/lib/utils/set-kind-label'
import { formatWeight } from '@/lib/utils/weight-unit'

/**
 * ROUT-04's read-only view. It shows the prescription and nothing else — the
 * payload has no place to carry a session, a record or a note, and the copy
 * says so rather than leaving a reader to wonder what they are seeing.
 */
export function SharedRoutineView({ routine }: { routine: SharedRoutine }) {
	const locale = useLocale() as Locale
	const weightUnit = useWeightUnit()
	const tKinds = useTranslations('workout.setKinds')
	const tSharing = useTranslations('routines.sharing')
	const tEx = useTranslations('catalog.exercises')
	const tBlock = useTranslations('routines.linearBlock')
	const { setup } = routine
	const exerciseCount = countSharedExercises(routine)

	const describeSet = (set: RoutineSet) => {
		const reps =
			set.repType === 'RANGE'
				? tSharing('setRepsRange', {
						min: set.minReps ?? '?',
						max: set.maxReps ?? '?',
					})
				: tSharing('setRepsFixed', { reps: set.reps ?? '?' })
		// A shared routine carries its target loads: without them a program is
		// not something a reader can actually follow.
		const kind =
			set.kind && set.kind !== 'WORKING'
				? `${setKindLabel(set.kind, tKinds)} · `
				: ''
		return set.weight
			? `${kind}${reps} · ${formatWeight(set.weight, weightUnit, locale)}`
			: `${kind}${reps}`
	}

	return (
		<article className="space-y-8">
			{/* v1.1: the routine's name is the page's inscription, over its
			    double rule, as a shared workout's is -- the two standalone pages
			    a member sends out now open the same way. */}
			<header className="rule-heading space-y-2 pb-6">
				<p className="type-body-sm text-ink-3">
					{tSharing('sharedBy', { name: describeSharedRoutineOwner(routine) })}
				</p>
				<h1 className="type-page corner-brackets inline-block text-foreground">
					{setup.name}
				</h1>
				{setup.description ? (
					<p className="type-body-sm max-w-[68ch] text-ink-2">
						{setup.description}
					</p>
				) : null}
				<p className="type-data text-ink-3">
					{tSharing('summary', {
						days: tSharing('summaryDays', { count: setup.days.length }),
						exercises: tSharing('summaryExercises', { count: exerciseCount }),
						mode:
							setup.scheduleMode === 'ROTATION'
								? tSharing('summaryRotation')
								: tSharing('summaryWeekly'),
					})}
				</p>
				{/* UX-17 (§23.4): one line shown, the full statement one tap away. */}
				<Explanation summary={tSharing('sharedNoteSummary')}>
					<p>{sharedRoutineNote(tSharing)}</p>
				</Explanation>
			</header>

			{setup.days.map(day => (
				<section
					key={`${day.order}-${day.dayOfWeek ?? 'rotation'}`}
					className="space-y-3"
				>
					<h2 className="type-panel rule-heading pb-2 text-foreground">
						{routineDayLabel({
							name: day.name,
							dayOfWeek: day.dayOfWeek,
							order: day.order,
						})}
					</h2>
					<ul className="border-t border-rule-faint">
						{day.exercises.map((exercise, index) => {
							// ROUT-12: its place in a superset or circuit.
							const position = exerciseGroupPosition(day.exercises, index)
							// ROUT-17: a block's loads are a share of the owner's max,
							// which a shared routine never carries; the reader's own
							// max stands in, so its sets read as shares of it.
							const linear =
								exercise.progressionScheme === 'LINEAR_PERIODIZATION'
							let working = 0
							return (
								<li
									key={`${exercise.order}-${exercise.exercise.id}`}
									className="rule-row grid gap-2 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6"
								>
									<div className="min-w-0">
										{position ? (
											<p className="type-body-sm text-ink-3">
												{exerciseGroupLabel(position)}
											</p>
										) : null}
										<h3 className="type-panel text-foreground">
											{exerciseLabel(exercise.exercise.name, tEx)}
										</h3>
										<p className="type-body-sm mt-0.5 text-ink-3">
											{tSharing('exerciseLine', {
												sets: exercise.sets.length,
												seconds: exercise.restSeconds,
												progression: linear
													? 'lp'
													: exercise.progressionScheme !== 'NONE'
														? 'on'
														: 'off',
											})}
										</p>
										{linear ? (
											<p className="type-body-sm mt-1 text-ink-3">
												{lpSharedTableNote(locale, tBlock)}
											</p>
										) : null}
										{exercise.note ? (
											<p className="type-body-sm mt-1 text-ink-2">
												{exercise.note}
											</p>
										) : null}
									</div>
									<ol className="type-data space-y-0.5 text-ink-2 lg:text-right">
										{exercise.sets.map(set => (
											<li key={set.setNumber}>
												{set.setNumber}.{' '}
												{linear && set.kind !== 'WARMUP'
													? lpSharedSetLabel(working++, locale, tBlock)
													: describeSet(set)}
											</li>
										))}
									</ol>
								</li>
							)
						})}
					</ul>
				</section>
			))}
		</article>
	)
}
