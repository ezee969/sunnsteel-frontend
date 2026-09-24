'use client'

import {
	routineDayLabel,
	type RoutineSet,
	SET_KIND_LABELS,
	type SharedRoutine,
} from '@sunsteel/contracts'

import { useWeightUnit } from '@/hooks/use-weight-unit'
import {
	countSharedExercises,
	describeSharedRoutineOwner,
	SHARED_ROUTINE_NOTE,
} from '@/lib/utils/routine-sharing'
import { formatWeight } from '@/lib/utils/weight-unit'

/**
 * ROUT-04's read-only view. It shows the prescription and nothing else — the
 * payload has no place to carry a session, a record or a note, and the copy
 * says so rather than leaving a reader to wonder what they are seeing.
 */
export function SharedRoutineView({ routine }: { routine: SharedRoutine }) {
	const weightUnit = useWeightUnit()
	const { setup } = routine
	const exerciseCount = countSharedExercises(routine)

	const describeSet = (set: RoutineSet) => {
		const reps =
			set.repType === 'RANGE'
				? `${set.minReps ?? '?'}–${set.maxReps ?? '?'} reps`
				: `${set.reps ?? '?'} reps`
		// A shared routine carries its target loads: without them a program is
		// not something a reader can actually follow.
		const kind =
			set.kind && set.kind !== 'WORKING'
				? `${SET_KIND_LABELS[set.kind]} · `
				: ''
		return set.weight
			? `${kind}${reps} · ${formatWeight(set.weight, weightUnit)}`
			: `${kind}${reps}`
	}

	return (
		<article className="space-y-8">
			<header className="space-y-2">
				<p className="type-body-sm text-ink-3">
					Shared by {describeSharedRoutineOwner(routine)}
				</p>
				<h1 className="type-section text-foreground">{setup.name}</h1>
				{setup.description ? (
					<p className="type-body-sm max-w-[68ch] text-ink-2">
						{setup.description}
					</p>
				) : null}
				<p className="type-data text-ink-3">
					{setup.days.length} {setup.days.length === 1 ? 'day' : 'days'} ·{' '}
					{exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'} ·{' '}
					{setup.scheduleMode === 'ROTATION' ? 'Rotation' : 'Weekly'}
				</p>
				<p className="type-body-sm max-w-[68ch] text-ink-3">
					{SHARED_ROUTINE_NOTE}
				</p>
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
						{day.exercises.map(exercise => (
							<li
								key={`${exercise.order}-${exercise.exercise.id}`}
								className="rule-row grid gap-2 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6"
							>
								<div className="min-w-0">
									<h3 className="type-panel text-foreground">
										{exercise.exercise.name}
									</h3>
									<p className="type-body-sm mt-0.5 text-ink-3">
										{exercise.sets.length}{' '}
										{exercise.sets.length === 1 ? 'set' : 'sets'} ·{' '}
										{exercise.restSeconds}s rest
										{exercise.progressionScheme !== 'NONE'
											? ' · progression on'
											: ''}
									</p>
									{exercise.note ? (
										<p className="type-body-sm mt-1 text-ink-2">
											{exercise.note}
										</p>
									) : null}
								</div>
								<ol className="type-data space-y-0.5 text-ink-2 lg:text-right">
									{exercise.sets.map(set => (
										<li key={set.setNumber}>
											{set.setNumber}. {describeSet(set)}
										</li>
									))}
								</ol>
							</li>
						))}
					</ul>
				</section>
			))}
		</article>
	)
}
