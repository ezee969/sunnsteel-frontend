import { AlertTriangle } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import {
	LANDING_FACTS,
	MUSCLE_WEEKS,
	STRENGTH_EXAMPLE,
} from '@/lib/site/landing-examples'
import { formatWeight } from '@/lib/utils/weight-unit'

import { SiteMuscleMap } from './site-muscle-map'
import {
	ExampleMark,
	PlanTag,
	SiteCard,
	SiteSectionHeading,
} from './site-parts'

/**
 * SITE-01 §12.6: progress read from the member's own sets, week by week, and
 * an analysis that states numbers, never verdicts. The map rests on the
 * example's last week, the final state every width shows without JavaScript;
 * the motion phase steps the weeks with the scroll. Card names, rows and the
 * question are the app's own messages.
 */
const WEEKS = MUSCLE_WEEKS.map((_, index) => index + 1)

function StrengthLine({ values }: { values: readonly number[] }) {
	const min = Math.min(...values) - 0.5
	const max = Math.max(...values) + 0.5
	const points = values.map((value, index) => ({
		x: 12 + (index * 376) / (values.length - 1),
		y: 64 - ((value - min) / (max - min)) * 52,
	}))
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 400 72"
			className="h-auto w-full"
			focusable="false"
		>
			<line x1={0} x2={400} y1={71} y2={71} className="stroke-rule" />
			<polyline
				points={points.map(({ x, y }) => `${x},${y.toFixed(1)}`).join(' ')}
				className="fill-none stroke-foreground"
				strokeWidth={2}
				strokeLinejoin="round"
			/>
			{points.map(({ x, y }) => (
				<circle key={x} cx={x} cy={y} r={3.5} className="fill-foreground" />
			))}
		</svg>
	)
}

function AnalysisCard({
	name,
	tag,
	body,
	children,
}: {
	name: string
	tag: string
	body: string
	children: ReactNode
}) {
	return (
		<SiteCard as="li" className="site-analysis">
			<div className="flex items-start justify-between gap-3">
				<h3 className="type-panel">{name}</h3>
				<PlanTag>{tag}</PlanTag>
			</div>
			<p className="type-body-sm text-ink-2">{body}</p>
			<div aria-hidden="true" className="site-analysis-mock">
				{children}
			</div>
		</SiteCard>
	)
}

export async function SiteProgress() {
	const t = await getTranslations('site.progress')
	const tMock = await getTranslations('site.mock')
	const tExercises = await getTranslations('catalog.exercises')
	const tPlateaus = await getTranslations('planning.plateaus')
	const tSignals = await getTranslations('progress.signals')
	const tDeload = await getTranslations('progress.deloadSuggestion')
	const tReview = await getTranslations('progress.review')
	const locale = (await getLocale()) as Locale
	const kg = (value: number) => formatWeight(value, 'KG', locale)
	const bench = exerciseLabel(STRENGTH_EXAMPLE.exercise, tExercises)
	const strength = STRENGTH_EXAMPLE.weeklyE1rmKg.slice(-WEEKS.length)
	const current = WEEKS[WEEKS.length - 1]
	const day = dateFormatter(locale, { day: 'numeric', month: 'short' })
	const deloadDates = `${day.format(new Date(2026, 11, 7))} – ${day.format(new Date(2026, 11, 13))}`

	return (
		<section aria-labelledby="progress-heading" className="site-section">
			<SiteSectionHeading id="progress-heading">
				{t('heading')}
			</SiteSectionHeading>

			<div className="site-progress-stage">
				<div className="site-progress-text">
					<h3 className="type-panel">{t('map.title')}</h3>
					<p className="type-body site-body">{t('map.body')}</p>
					<div className="site-week-rail">
						<p className="type-label text-ink-3">{t('map.weeksLabel')}</p>
						<ol aria-hidden="true" className="flex gap-1">
							{WEEKS.map(week => (
								<li
									key={week}
									data-current={week === current || undefined}
									className="site-week"
								>
									{t('map.week', { n: week })}
								</li>
							))}
						</ol>
						<p className="type-body-sm text-ink-3">
							{t('map.planLine', {
								free: LANDING_FACTS.muscleWeeksFree,
								pro: LANDING_FACTS.muscleWeeksPro,
							})}
						</p>
					</div>
				</div>
				<div className="site-progress-map">
					<div className="mb-2 flex justify-end">
						<ExampleMark label={tMock('example')} />
					</div>
					<SiteMuscleMap week={current} />
					<div className="site-strength">
						<p className="flex items-baseline justify-between gap-3">
							<span className="type-body-sm text-ink-2">
								{t('map.strength', { exercise: bench })}
							</span>
							<span className="type-data-strong">
								{kg(strength[strength.length - 1])}
							</span>
						</p>
						<StrengthLine values={strength} />
					</div>
				</div>
			</div>

			<ul className="site-analysis-strip">
				<AnalysisCard
					name={tPlateaus('heading')}
					tag={t('tags.free')}
					body={t('cards.plateaus.body')}
				>
					<p className="type-panel">{exerciseLabel('Squat', tExercises)}</p>
					<p className="type-body-sm text-ink-2">
						{tPlateaus('noNewBest', { count: 4 })}
					</p>
				</AnalysisCard>
				<AnalysisCard
					name={t('cards.signals.name')}
					tag={t('tags.pro')}
					body={t('cards.signals.body')}
				>
					<p className="flex items-center justify-between gap-2">
						<span className="type-panel">{tSignals('titleEffort')}</span>
						<span className="type-body-sm inline-flex items-center gap-1 text-ink-2">
							<AlertTriangle className="size-3.5 text-warning-strong" />
							{tSignals('markedLabel')}
						</span>
					</p>
					<p className="type-body-sm text-ink-2">{t('cards.signals.row')}</p>
				</AnalysisCard>
				<AnalysisCard
					name={t('cards.deload.name')}
					tag={t('tags.pro')}
					body={t('cards.deload.body')}
				>
					<p className="type-panel">{tDeload('title')}</p>
					<p className="type-data text-ink-2">{deloadDates}</p>
					<span className="type-action site-outline-mock">
						{tDeload('action')}
					</span>
				</AnalysisCard>
				<AnalysisCard
					name={t('cards.review.name')}
					tag={t('tags.pro')}
					body={t('cards.review.body')}
				>
					<p className="type-panel">{tReview('questionText.CHANGES')}</p>
					<p className="type-body-sm text-ink-2">
						{t.rich('cards.review.finding', {
							exercise: bench,
							from: kg(80),
							to: kg(82.5),
							reps: 8,
							figure: chunks => (
								<span className="site-figure-link">{chunks}</span>
							),
						})}
					</p>
				</AnalysisCard>
			</ul>
		</section>
	)
}
