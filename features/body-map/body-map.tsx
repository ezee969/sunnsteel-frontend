'use client'

import type { MuscleGroup } from '@sunsteel/contracts'
import { useLocale, useTranslations } from 'next-intl'
import { type CSSProperties, type ReactNode, useState } from 'react'

import type { Locale } from '@/i18n/config'
import { intlLocale, numberFormatter } from '@/i18n/date-locale'
import { cn } from '@/lib/utils'
import {
	BODY_MAP_LEVELS,
	type BodyMapLevel,
	bodyMapLevel,
	type MuscleSets,
	trainedMuscles,
	untrainedMuscles,
} from '@/lib/utils/body-map'
import { getFriendlyMuscleName } from '@/lib/utils/muscle-groups'

import {
	BODY_MAP_BACK,
	BODY_MAP_BACK_DETAILS,
	BODY_MAP_FRONT,
	BODY_MAP_FRONT_DETAILS,
	BODY_MAP_OUTLINE,
	BODY_MAP_VIEWBOX,
	type BodyMapRegion,
} from './body-map-geometry'

/** Design system §32: one verdigris step per band; 0 is the untrained figure. */
const FILL: Record<BodyMapLevel, string> = {
	0: 'fill-intensity-0',
	1: 'fill-intensity-1',
	2: 'fill-intensity-2',
	3: 'fill-intensity-3',
	4: 'fill-intensity-4',
	5: 'fill-intensity-5',
}

export const INTENSITY_SWATCH: Record<BodyMapLevel, string> = {
	0: 'bg-intensity-0',
	1: 'bg-intensity-1',
	2: 'bg-intensity-2',
	3: 'bg-intensity-3',
	4: 'bg-intensity-4',
	5: 'bg-intensity-5',
}

interface FigureProps {
	regions: readonly BodyMapRegion[]
	details: string
	sets: MuscleSets
	active: MuscleGroup | null
	onActiveChange: (muscle: MuscleGroup | null) => void
	caption: string
}

function Figure({
	regions,
	details,
	sets,
	active,
	onActiveChange,
	caption,
}: FigureProps) {
	const activeRegion = regions.find(region => region.muscle === active)
	return (
		<figure className="flex min-w-0 flex-col items-center gap-2">
			<svg
				viewBox={BODY_MAP_VIEWBOX}
				className="h-auto w-full"
				aria-hidden
				focusable="false"
			>
				<path d={BODY_MAP_OUTLINE} className="fill-intensity-0" />
				{regions.map(({ muscle, d }) => (
					<path
						key={muscle}
						d={d}
						className={cn(
							FILL[bodyMapLevel(sets.get(muscle) ?? 0)],
							'stroke-surface',
						)}
						strokeWidth={1.25}
						strokeLinejoin="round"
						vectorEffect="non-scaling-stroke"
						// A pointer names its muscle in the list beside the figure; the
						// list itself carries every number for keyboard and screen readers.
						onPointerEnter={event => {
							if (event.pointerType === 'mouse') onActiveChange(muscle)
						}}
						onPointerLeave={event => {
							if (event.pointerType === 'mouse') onActiveChange(null)
						}}
						onClick={() => onActiveChange(active === muscle ? null : muscle)}
					/>
				))}
				<path
					d={details}
					className="fill-none stroke-surface"
					strokeWidth={1.25}
					strokeLinecap="round"
					vectorEffect="non-scaling-stroke"
					pointerEvents="none"
				/>
				{activeRegion ? (
					<path
						d={activeRegion.d}
						className="fill-none stroke-foreground"
						strokeWidth={2}
						strokeLinejoin="round"
						vectorEffect="non-scaling-stroke"
						pointerEvents="none"
					/>
				) : null}
			</svg>
			<figcaption className="type-label text-ink-3">{caption}</figcaption>
		</figure>
	)
}

/**
 * The front and back alone, shaded and still: the public site's mock-ups
 * (SITE-01 §12.4), where nothing is pointed at and the section's text says
 * what the figure shows.
 */
export function BodyMapFigures({
	sets,
	className,
}: {
	sets: MuscleSets
	className?: string
}) {
	return (
		<div aria-hidden className={cn('grid grid-cols-2 gap-2', className)}>
			{[BODY_MAP_FRONT, BODY_MAP_BACK].map((regions, side) => (
				<svg
					key={side}
					viewBox={BODY_MAP_VIEWBOX}
					// UX-27 (§34): its muscles are tapped, so a quick second tap
					// never starts a selection.
					className="h-auto w-full select-none"
					focusable="false"
				>
					<path d={BODY_MAP_OUTLINE} className="fill-intensity-0" />
					{regions.map(({ muscle, d }) => (
						<path
							key={muscle}
							d={d}
							className={cn(
								FILL[bodyMapLevel(sets.get(muscle) ?? 0)],
								'site-map-region stroke-surface-sunk',
							)}
							// The site's script shades the figure band by band.
							style={
								{
									'--band': bodyMapLevel(sets.get(muscle) ?? 0),
								} as CSSProperties
							}
							strokeWidth={1}
							strokeLinejoin="round"
							vectorEffect="non-scaling-stroke"
						/>
					))}
					<path
						d={side === 0 ? BODY_MAP_FRONT_DETAILS : BODY_MAP_BACK_DETAILS}
						className="fill-none stroke-surface-sunk"
						strokeWidth={1}
						strokeLinecap="round"
						vectorEffect="non-scaling-stroke"
					/>
				</svg>
			))}
		</div>
	)
}

/** The bands of §32, shared by the body map and the weekly matrix. */
export function BodyMapLegend({ className }: { className?: string }) {
	const t = useTranslations('progress.bodyMap')
	return (
		<ul
			aria-label={t('legendLabel')}
			className={cn('flex flex-wrap gap-x-3 gap-y-1', className)}
		>
			{BODY_MAP_LEVELS.map(level => (
				<li
					key={level}
					className="type-body-sm flex items-center gap-1.5 text-ink-3"
				>
					<span
						className={cn('size-3 border border-rule', INTENSITY_SWATCH[level])}
						aria-hidden
					/>
					{t(`band${level}`)}
				</li>
			))}
		</ul>
	)
}

interface MuscleMapProps {
	sets: MuscleSets
	/** Above the figure: the week's navigation on Progress. */
	header?: ReactNode
	/** Shown in place of the list when no muscle has sets. */
	emptyText: string
	/** The sentence naming the muscles without sets. */
	untrainedText: (muscles: string) => string
}

/**
 * PROG-15: the front and back of a figure shaded by the sets each muscle has,
 * beside the list of those numbers, which is what a screen reader and a
 * keyboard read. Pointing at a muscle in either marks it in the other.
 */
export function MuscleMap({
	sets,
	header,
	emptyText,
	untrainedText,
}: MuscleMapProps) {
	const t = useTranslations('progress.bodyMap')
	const tMuscles = useTranslations('routines.muscles')
	const locale = useLocale() as Locale
	const [active, setActive] = useState<MuscleGroup | null>(null)
	const rows = trainedMuscles(sets)
	const untrained = untrainedMuscles(sets)
	const format = numberFormatter(locale, { maximumFractionDigits: 1 })
	const names = new Intl.ListFormat(intlLocale(locale), {
		type: 'conjunction',
	}).format(untrained.map(muscle => getFriendlyMuscleName(muscle, tMuscles)))

	return (
		// Its own width decides the layout: a full Progress section puts the list
		// beside the figure, the builder's narrower column stacks them.
		<div className="@container border border-rule bg-surface">
			{header ? (
				<div className="rule-row flex items-center gap-2 px-3 py-2">
					{header}
				</div>
			) : null}
			<div className="grid gap-6 p-4 @xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
				<div className="mx-auto w-full max-w-[20rem] space-y-4">
					<div
						role="img"
						aria-label={t('summary', {
							trained: rows.length,
							untrained: untrained.length,
						})}
						className="grid grid-cols-2 gap-3"
					>
						<Figure
							regions={BODY_MAP_FRONT}
							details={BODY_MAP_FRONT_DETAILS}
							sets={sets}
							active={active}
							onActiveChange={setActive}
							caption={t('front')}
						/>
						<Figure
							regions={BODY_MAP_BACK}
							details={BODY_MAP_BACK_DETAILS}
							sets={sets}
							active={active}
							onActiveChange={setActive}
							caption={t('back')}
						/>
					</div>
					<BodyMapLegend />
				</div>
				<div className="min-w-0 space-y-3">
					{rows.length === 0 ? (
						<p className="type-body-sm text-ink-3">{emptyText}</p>
					) : (
						<ul aria-label={t('listLabel')}>
							{rows.map(row => (
								<li
									key={row.muscle}
									onPointerEnter={() => setActive(row.muscle)}
									onPointerLeave={() => setActive(null)}
									className={cn(
										'rule-row flex items-baseline justify-between gap-4 px-1 py-1.5',
										active === row.muscle && 'bg-surface-sunk',
									)}
								>
									<span className="type-body-sm flex items-center gap-2 text-ink">
										<span
											className={cn(
												'size-3 shrink-0 border border-rule',
												INTENSITY_SWATCH[bodyMapLevel(row.sets)],
											)}
											aria-hidden
										/>
										{getFriendlyMuscleName(row.muscle, tMuscles)}
									</span>
									<span className="type-data text-ink">
										{t('sets', {
											sets: row.sets,
											formatted: format.format(row.sets),
										})}
									</span>
								</li>
							))}
						</ul>
					)}
					{rows.length > 0 && untrained.length > 0 ? (
						<p className="type-body-sm text-ink-3">{untrainedText(names)}</p>
					) : null}
				</div>
			</div>
		</div>
	)
}
