'use client'

import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { getFriendlyMuscleName } from '@/lib/utils/muscle-groups'
import { formatDuration } from '@/lib/utils/time-format.utils'

import {
	ASSUMED_REPS,
	EQUIPMENT_LABELS,
	type EquipmentCheck,
	formatSetCount,
	type RoutineQualitySummary as Summary,
	SECONDS_PER_REP,
} from '../utils/routine-quality'
import { DAYS_OF_WEEK } from '../utils/routine-summary'

interface RoutineQualitySummaryProps {
	status: 'loading' | 'error' | 'ready'
	summary: Summary
	/** False while the training locations are loading or failed to load. */
	showEquipmentCheck: boolean
}

function QualityBlock({
	title,
	caption,
	children,
}: {
	title: string
	caption?: string
	children: ReactNode
}) {
	return (
		// §10.2: a data cluster never grows past 480px, so a muscle name and
		// its set count stay readable as one row on wide screens.
		<div className="max-w-[var(--cluster-max)] space-y-2">
			<h4 className="type-label text-ink-2">{title}</h4>
			{children}
			{caption && <p className="type-body-sm text-ink-3">{caption}</p>}
		</div>
	)
}

function WarningNote({ children }: { children: ReactNode }) {
	// §4.3 rule 4: warning is a mark and a glyph, the words stay in ink.
	return (
		<div className="mark mark-warning flex gap-2 bg-surface-sunk py-2 pl-3 pr-3">
			<AlertTriangle
				className="mt-0.5 h-4 w-4 shrink-0 text-warning-strong"
				aria-hidden
			/>
			<div className="type-body-sm text-ink">{children}</div>
		</div>
	)
}

function EquipmentCheckLine({ check }: { check: EquipmentCheck }) {
	switch (check.status) {
		case 'no-location':
			return (
				<p className="type-body-sm text-ink-3">
					Add your gym&apos;s equipment in{' '}
					<Link
						href="/settings"
						className="text-ink underline underline-offset-4"
					>
						Settings
					</Link>{' '}
					to check it here.
				</p>
			)
		case 'nothing-listed':
			return (
				<p className="type-body-sm text-ink-3">
					{check.locationName} has no equipment listed in Settings.
				</p>
			)
		case 'all-listed':
			return (
				<p className="type-body-sm text-ink-2">
					Everything is listed at {check.locationName}.
				</p>
			)
		case 'missing':
			return (
				<WarningNote>
					Not listed at {check.locationName}:{' '}
					{check.missing.map(item => EQUIPMENT_LABELS[item]).join(', ')}.
				</WarningNote>
			)
	}
}

/**
 * ROUT-10: the week this routine asks for, shown before it is saved. Every
 * figure comes from the planned sets and the catalog metadata; nothing here
 * blocks saving.
 */
export function RoutineQualitySummary({
	status,
	summary,
	showEquipmentCheck,
}: RoutineQualitySummaryProps) {
	return (
		<section aria-labelledby="routine-quality-heading" className="space-y-4">
			<div className="rule-heading pb-2">
				<h3 id="routine-quality-heading" className="type-panel text-foreground">
					Quality Summary
				</h3>
				<p className="type-body-sm text-ink-3">
					Worked out from the sets you planned. Nothing here stops you from
					saving.
				</p>
			</div>

			{status === 'loading' && (
				<p className="type-body-sm text-ink-3" role="status">
					Loading exercise details…
				</p>
			)}

			{status === 'error' && (
				<p className="type-body-sm text-ink-2">
					Exercise details could not be loaded, so the summary is unavailable.
					You can still save the routine.
				</p>
			)}

			{status === 'ready' && (
				<div className="grid gap-6 lg:grid-cols-2">
					<QualityBlock
						title="Weekly sets by muscle"
						caption="Secondary muscles count as half a set, as they do on Progress."
					>
						{summary.muscleSets.length === 0 ? (
							<p className="type-body-sm text-ink-3">No sets planned yet.</p>
						) : (
							<ul>
								{summary.muscleSets.map(({ muscle, sets }) => (
									<li
										key={muscle}
										className="rule-row flex items-baseline justify-between gap-4 py-1.5"
									>
										<span className="type-body-sm text-ink">
											{getFriendlyMuscleName(muscle)}
										</span>
										<span className="type-data text-ink">
											{formatSetCount(sets)}
										</span>
									</li>
								))}
							</ul>
						)}
					</QualityBlock>

					<QualityBlock title="Likely imbalances">
						{summary.imbalances.length === 0 ? (
							<p className="type-body-sm text-ink-2">
								No large gaps between upper and lower body, pressing and
								pulling, or quads and hamstrings.
							</p>
						) : (
							<ul className="space-y-2">
								{summary.imbalances.map(imbalance => (
									<li key={imbalance.kind}>
										<WarningNote>
											<p className="font-medium">{imbalance.title}</p>
											<p className="text-ink-2">{imbalance.evidence}</p>
										</WarningNote>
									</li>
								))}
							</ul>
						)}
						{summary.unclassifiedExercises > 0 && (
							<p className="type-body-sm text-ink-3">
								{summary.unclassifiedExercises === 1
									? '1 exercise has no movement data and is'
									: `${summary.unclassifiedExercises} exercises have no movement data and are`}{' '}
								left out of these checks.
							</p>
						)}
					</QualityBlock>

					<QualityBlock
						title="Estimated duration"
						caption={`Approximate: ${SECONDS_PER_REP} s per rep (${ASSUMED_REPS} reps when none are set), your rest after every set but the last, and 1 min to set up each exercise. Warm-ups are not included.`}
					>
						<ul>
							{summary.durations.map(({ dayOfWeek, seconds }) => (
								<li
									key={dayOfWeek}
									className="rule-row flex items-baseline justify-between gap-4 py-1.5"
								>
									<span className="type-body-sm text-ink">
										{DAYS_OF_WEEK[dayOfWeek]}
									</span>
									<span className="type-data text-ink">
										{seconds > 0 ? formatDuration(seconds) : '—'}
									</span>
								</li>
							))}
						</ul>
					</QualityBlock>

					<QualityBlock title="Equipment">
						<p className="type-body-sm text-ink">
							{summary.equipment.length === 0
								? 'Bodyweight only. No equipment needed.'
								: summary.equipment
										.map(item => EQUIPMENT_LABELS[item])
										.join(', ')}
						</p>
						{showEquipmentCheck && summary.equipment.length > 0 && (
							<EquipmentCheckLine check={summary.equipmentCheck} />
						)}
					</QualityBlock>
				</div>
			)}
		</section>
	)
}
