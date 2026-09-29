'use client'

import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import type { Translator } from '@/i18n/translator'
import { equipmentLabel } from '@/lib/utils/exercise-equipment'
import { getFriendlyMuscleName } from '@/lib/utils/muscle-groups'
import { formatDuration } from '@/lib/utils/time-format.utils'

import {
	ASSUMED_REPS,
	type EquipmentCheck,
	formatSetCount,
	type RoutineQualitySummary as Summary,
	SECONDS_PER_REP,
} from '../utils/routine-quality'

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

function EquipmentCheckLine({
	check,
	t,
	tEquipment,
}: {
	check: EquipmentCheck
	t: Translator<'routines.quality'>
	tEquipment: Translator<'routines.equipment'>
}) {
	switch (check.status) {
		case 'no-location':
			return (
				<p className="type-body-sm text-ink-3">
					{t.rich('equipmentNoLocation', {
						link: chunks => (
							<Link
								href="/settings/training"
								className="text-ink underline underline-offset-4"
							>
								{chunks}
							</Link>
						),
					})}
				</p>
			)
		case 'nothing-listed':
			return (
				<p className="type-body-sm text-ink-3">
					{t('equipmentNothingListed', { location: check.locationName })}
				</p>
			)
		case 'all-listed':
			return (
				<p className="type-body-sm text-ink-2">
					{t('equipmentAllListed', { location: check.locationName })}
				</p>
			)
		case 'missing':
			return (
				<WarningNote>
					{t('equipmentMissing', {
						location: check.locationName,
						items: check.missing
							.map(item => equipmentLabel(item, tEquipment))
							.join(', '),
					})}
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
	const t = useTranslations('routines.quality')
	const tMuscles = useTranslations('routines.muscles')
	const tEquipment = useTranslations('routines.equipment')
	return (
		<section aria-labelledby="routine-quality-heading" className="space-y-4">
			<div className="rule-heading pb-2">
				<h3 id="routine-quality-heading" className="type-panel text-foreground">
					{t('heading')}
				</h3>
				<p className="type-body-sm text-ink-3">{t('headingNote')}</p>
			</div>

			{status === 'loading' && (
				<p className="type-body-sm text-ink-3" role="status">
					{t('loading')}
				</p>
			)}

			{status === 'error' && (
				<p className="type-body-sm text-ink-2">{t('loadError')}</p>
			)}

			{status === 'ready' && (
				<div className="grid gap-6 lg:grid-cols-2">
					<QualityBlock
						title={
							summary.perRotation ? t('musclesPerRotation') : t('musclesWeekly')
						}
						caption={t('musclesCaption')}
					>
						{summary.muscleSets.length === 0 ? (
							<p className="type-body-sm text-ink-3">{t('noSetsPlanned')}</p>
						) : (
							<ul>
								{summary.muscleSets.map(({ muscle, sets }) => (
									<li
										key={muscle}
										className="rule-row flex items-baseline justify-between gap-4 py-1.5"
									>
										<span className="type-body-sm text-ink">
											{getFriendlyMuscleName(muscle, tMuscles)}
										</span>
										<span className="type-data text-ink">
											{formatSetCount(sets)}
										</span>
									</li>
								))}
							</ul>
						)}
					</QualityBlock>

					<QualityBlock title={t('imbalancesTitle')}>
						{summary.imbalances.length === 0 ? (
							<p className="type-body-sm text-ink-2">{t('noImbalances')}</p>
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
								{t('unclassified', { count: summary.unclassifiedExercises })}
							</p>
						)}
					</QualityBlock>

					<QualityBlock
						title={t('durationTitle')}
						caption={t('durationCaption', {
							secondsPerRep: SECONDS_PER_REP,
							reps: ASSUMED_REPS,
						})}
					>
						<ul>
							{summary.durations.map(({ slot, label, seconds }) => (
								<li
									key={slot}
									className="rule-row flex items-baseline justify-between gap-4 py-1.5"
								>
									<span className="type-body-sm text-ink">{label}</span>
									<span className="type-data text-ink">
										{seconds > 0 ? formatDuration(seconds) : '—'}
									</span>
								</li>
							))}
						</ul>
					</QualityBlock>

					<QualityBlock title={t('equipmentTitle')}>
						<p className="type-body-sm text-ink">
							{summary.equipment.length === 0
								? t('bodyweightOnly')
								: summary.equipment
										.map(item => equipmentLabel(item, tEquipment))
										.join(', ')}
						</p>
						{showEquipmentCheck && summary.equipment.length > 0 && (
							<EquipmentCheckLine
								check={summary.equipmentCheck}
								t={t}
								tEquipment={tEquipment}
							/>
						)}
					</QualityBlock>
				</div>
			)}
		</section>
	)
}
