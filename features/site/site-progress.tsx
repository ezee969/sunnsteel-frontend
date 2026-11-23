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

import { PlanTag, SiteCard, SiteSectionHeading } from './site-parts'
import { SiteProgressStage } from './site-progress-stage'

/**
 * SITE-01 §12.6: progress read from the member's own sets, week by week, and
 * an analysis that states numbers, never verdicts. The map rests on the
 * example's last week, the final state every width shows without JavaScript;
 * the motion phase steps the weeks with the scroll. Card names, rows and the
 * question are the app's own messages.
 */
const WEEKS = MUSCLE_WEEKS.map((_, index) => index + 1)

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
			<div aria-hidden="true" className="dark site-analysis-mock">
				{children}
			</div>
		</SiteCard>
	)
}

export async function SiteProgress() {
	const t = await getTranslations('site.progress')
	const tExercises = await getTranslations('catalog.exercises')
	const tPlateaus = await getTranslations('planning.plateaus')
	const tSignals = await getTranslations('progress.signals')
	const tDeload = await getTranslations('progress.deloadSuggestion')
	const tReview = await getTranslations('progress.review')
	const locale = (await getLocale()) as Locale
	const kg = (value: number) => formatWeight(value, 'KG', locale)
	const bench = exerciseLabel(STRENGTH_EXAMPLE.exercise, tExercises)
	const strength = [...STRENGTH_EXAMPLE.weeklyE1rmKg.slice(-WEEKS.length)]
	const day = dateFormatter(locale, { day: 'numeric', month: 'short' })
	const deloadDates = `${day.format(new Date(2026, 11, 7))} – ${day.format(new Date(2026, 11, 13))}`

	return (
		<section aria-labelledby="progress-heading" className="site-section">
			<SiteSectionHeading id="progress-heading">
				{t('heading')}
			</SiteSectionHeading>

			<SiteProgressStage
				title={t('map.title')}
				body={t('map.body')}
				weeksLabel={t('map.weeksLabel')}
				weekLabels={WEEKS.map(week => t('map.week', { n: week }))}
				planLine={t('map.planLine', {
					free: LANDING_FACTS.muscleWeeksFree,
					pro: LANDING_FACTS.muscleWeeksPro,
				})}
				strengthLabel={t('map.strength', { exercise: bench })}
				strengthValues={strength}
				strengthLabels={strength.map(kg)}
			/>

			<ul className="site-analysis-strip" data-reveal="stagger">
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
