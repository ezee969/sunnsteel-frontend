import { Check } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { RankCrest } from '@/features/achievements/rank-crest'
import { BodyMapFigures } from '@/features/body-map/body-map'
import { achievementText, exerciseLabel, rankText } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import {
	EARN_EXAMPLE,
	MUSCLE_WEEKS,
	muscleSets,
	PLAN_TEMPLATE,
	RANKS,
	STRENGTH_EXAMPLE,
	TRAIN_EXAMPLE,
} from '@/lib/site/landing-examples'
import { progressionSchemeLabel } from '@/lib/utils/routine-progression'
import { templateDayName, templateText } from '@/lib/utils/routine-templates'
import { formatWeight } from '@/lib/utils/weight-unit'

import { motionVars } from './site-parts'

/**
 * SITE-01 §12.4: the four verbs' phone screens, each resting on the state its
 * script ends on (§7.3) -- the motion phase plays the scripts. Built from the
 * app's data and rules with synthetic values; names come from the app's
 * messages and the catalog, never retyped.
 */

export async function PlanScreen() {
	const tTemplates = await getTranslations('routines.templates')
	const tBuilder = await getTranslations('routines.builder')
	const tExercises = await getTranslations('catalog.exercises')
	const text = templateText(PLAN_TEMPLATE, tTemplates)
	const [first, ...rest] = PLAN_TEMPLATE.days
	const progression = progressionSchemeLabel('DOUBLE_PROGRESSION', tBuilder)
	return (
		<>
			<p className="site-screen-title">{text.name}</p>
			<p className="site-screen-caption">{text.summary}</p>
			<div
				className="site-screen-block sx-day"
				style={motionVars({ '--i': 0 })}
			>
				<p className="type-panel">{templateDayName(first, tTemplates)}</p>
				<ul className="site-screen-rows">
					{first.exercises.map((exercise, index) => (
						<li
							key={exercise.name}
							className="site-screen-row sx-row"
							style={motionVars({ '--i': index })}
						>
							<span className="truncate">
								{exerciseLabel(exercise.name, tExercises)}
							</span>
							<span className="type-data shrink-0">
								{exercise.sets} × {exercise.minReps}–{exercise.maxReps}
							</span>
						</li>
					))}
				</ul>
				<p className="site-screen-caption">{progression}</p>
			</div>
			<ul className="site-screen-rows">
				{rest.map((day, index) => (
					<li
						key={day.key}
						className="site-screen-row sx-day"
						style={motionVars({ '--i': index + 1 })}
					>
						<span className="type-panel">
							{templateDayName(day, tTemplates)}
						</span>
						<span className="site-screen-caption">
							{tTemplates('size', { count: day.exercises.length })}
						</span>
					</li>
				))}
			</ul>
		</>
	)
}

/** The bar with each side's plates, drawn to scale by weight. */
function PlateBar({ plates }: { plates: readonly number[] }) {
	const heights = plates.map(weight => 26 + weight * 1.6)
	const widths = plates.map(weight => (weight >= 20 ? 9 : 7))
	const centre = 120
	const sleeve = 70
	return (
		<svg viewBox="0 0 240 90" className="h-auto w-full" focusable="false">
			<rect x={10} y={42} width={220} height={6} className="fill-ink-3" />
			<rect
				x={centre - sleeve - 4}
				y={36}
				width={4}
				height={18}
				className="fill-ink-2"
			/>
			<rect
				x={centre + sleeve}
				y={36}
				width={4}
				height={18}
				className="fill-ink-2"
			/>
			{[-1, 1].map(direction => {
				let offset = sleeve + 6
				return plates.map((weight, index) => {
					const width = widths[index]
					const height = heights[index]
					const x = direction === 1 ? centre + offset : centre - offset - width
					offset += width + 2
					return (
						<rect
							key={`${direction}-${index}`}
							x={x}
							y={45 - height / 2}
							width={width}
							height={height}
							rx={1}
							className={`sx-plate ${weight >= 20 ? 'fill-foreground' : 'fill-ink-2'}`}
							style={motionVars({ '--i': index, '--dir': direction })}
						/>
					)
				})
			})}
		</svg>
	)
}

export async function TrainScreen() {
	const t = await getTranslations('site.verbs.train')
	const tExercises = await getTranslations('catalog.exercises')
	const locale = (await getLocale()) as Locale
	const kg = (value: number) => formatWeight(value, 'KG', locale)
	return (
		<>
			<p className="site-screen-title">{exerciseLabel('Squat', tExercises)}</p>
			<p className="site-screen-caption">{t('working')}</p>
			<p className="type-site-numeral site-screen-figure">
				{kg(TRAIN_EXAMPLE.workingKg)}
			</p>
			<div className="site-screen-block">
				<PlateBar plates={TRAIN_EXAMPLE.platesPerSide} />
				<p className="site-screen-row">
					<span>{t('plates')}</span>
					<span className="type-data">
						{TRAIN_EXAMPLE.platesPerSide.join(' + ')}
					</span>
				</p>
			</div>
			<p className="type-label mt-4 text-ink-3">{t('warmUp')}</p>
			<ol className="site-screen-rows">
				{TRAIN_EXAMPLE.ramp.map((set, index) => (
					<li
						key={set.weightKg}
						className="site-screen-row sx-ramp"
						style={motionVars({ '--i': index })}
					>
						<span className="type-data">
							{index === 0 ? t('bar') : kg(set.weightKg)} × {set.reps}
						</span>
						<Check className="size-3.5 text-ink-2" aria-hidden />
					</li>
				))}
			</ol>
		</>
	)
}

/** The strength chart's line, eight weekly points. */
function StrengthLine({ values }: { values: readonly number[] }) {
	const min = Math.min(...values) - 1
	const max = Math.max(...values) + 1
	const points = values
		.map((value, index) => {
			const x = 8 + (index * 224) / (values.length - 1)
			const y = 80 - ((value - min) / (max - min)) * 70
			return `${x.toFixed(1)},${y.toFixed(1)}`
		})
		.join(' ')
	return (
		<svg viewBox="0 0 240 88" className="h-auto w-full" focusable="false">
			{[10, 45, 80].map(y => (
				<line
					key={y}
					x1={0}
					x2={240}
					y1={y}
					y2={y}
					className="stroke-rule-faint"
				/>
			))}
			<polyline
				points={points}
				className="sx-line fill-none stroke-foreground"
				strokeWidth={2}
				strokeLinejoin="round"
				strokeLinecap="round"
				pathLength={1}
			/>
		</svg>
	)
}

export async function MeasureScreen() {
	const t = await getTranslations('site.verbs.measure')
	const tExercises = await getTranslations('catalog.exercises')
	const locale = (await getLocale()) as Locale
	const values = STRENGTH_EXAMPLE.weeklyE1rmKg
	return (
		<>
			<p className="site-screen-title">
				{exerciseLabel(STRENGTH_EXAMPLE.exercise, tExercises)}
			</p>
			<p className="site-screen-caption">{t('chart')}</p>
			<p className="type-site-numeral site-screen-figure">
				{formatWeight(values[values.length - 1], 'KG', locale)}
			</p>
			<StrengthLine values={values} />
			<BodyMapFigures
				sets={muscleSets(MUSCLE_WEEKS[MUSCLE_WEEKS.length - 1])}
				className="mx-auto mt-4 w-[78%]"
			/>
		</>
	)
}

export async function EarnScreen() {
	const t = await getTranslations('site.verbs.earn')
	const tRanks = await getTranslations('catalog.ranks')
	const tAchievements = await getTranslations('catalog.achievements')
	const rank = RANKS.find(entry => entry.id === EARN_EXAMPLE.rankId) ?? RANKS[0]
	const { title, description } = rankText(rank, tRanks)
	const milestone = achievementText(
		{ id: EARN_EXAMPLE.milestoneId, title: '' },
		tAchievements,
	)
	return (
		<>
			<p className="site-screen-caption mt-2">{t('rankLabel')}</p>
			<div className="flex flex-col items-center py-4 text-center">
				<span className="sx-crest">
					<RankCrest rankId={rank.id} className="size-24" />
				</span>
				<p className="site-screen-title sx-name mt-3">{title}</p>
				<p className="site-screen-caption sx-name mt-1 max-w-[22ch]">
					{description}
				</p>
			</div>
			<div className="site-screen-block sx-milestone">
				<p className="type-label text-ink-3">{t('milestone')}</p>
				<p className="site-screen-row">
					<span className="type-panel">{milestone.title}</span>
					<Check className="size-4" aria-hidden />
				</p>
				<p className="site-screen-caption">{milestone.description}</p>
			</div>
		</>
	)
}
