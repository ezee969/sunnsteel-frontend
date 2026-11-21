import { ArrowRight, ArrowUp } from 'lucide-react'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { RankCrest } from '@/features/achievements/rank-crest'
import { exerciseLabel, rankText } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import {
	EARN_EXAMPLE,
	LANDING_FACTS,
	PLAN_TEMPLATE,
	RANKS,
	STRENGTH_EXAMPLE,
	strengthChange,
	TRAIN_EXAMPLE,
} from '@/lib/site/landing-examples'
import { templateText } from '@/lib/utils/routine-templates'
import { formatWeight } from '@/lib/utils/weight-unit'

import { SitePhoneFrame, SiteSectionHeading } from './site-parts'
import {
	EarnScreen,
	MeasureScreen,
	PlanScreen,
	TrainScreen,
} from './verb-screens'

/**
 * SITE-01 §12.4: the whole product in four moves, each proven by the app's
 * own screen and sent to its feature page. This is the stacked layout every
 * width shows without JavaScript; the sticky desktop stage and the scripts
 * arrive with the motion phase. No filled action: the links are link-style.
 */
const VERBS = [
	{ key: 'plan', href: '/features/routine-builder', Screen: PlanScreen },
	{ key: 'train', href: '/features/workout-tracker', Screen: TrainScreen },
	{ key: 'measure', href: '/features/progress', Screen: MeasureScreen },
	{ key: 'earn', href: '/features/ranks', Screen: EarnScreen },
] as const

export async function SiteVerbs() {
	const t = await getTranslations('site.verbs')
	const tTemplates = await getTranslations('routines.templates')
	const tExercises = await getTranslations('catalog.exercises')
	const tRanks = await getTranslations('catalog.ranks')
	const tMock = await getTranslations('site.mock')
	const locale = (await getLocale()) as Locale
	const kg = (value: number) => formatWeight(value, 'KG', locale)
	const rank = RANKS.find(entry => entry.id === EARN_EXAMPLE.rankId) ?? RANKS[0]
	const weeks = STRENGTH_EXAMPLE.weeklyE1rmKg

	const callouts: Record<(typeof VERBS)[number]['key'], ReactNode> = {
		plan: t('plan.callout', {
			template: templateText(PLAN_TEMPLATE, tTemplates).name,
			days: PLAN_TEMPLATE.days.length,
		}),
		train: t('train.callout', {
			weight: kg(TRAIN_EXAMPLE.workingKg),
			plates: TRAIN_EXAMPLE.platesPerSide.join(' + '),
		}),
		measure: (
			<>
				<ArrowUp className="size-4 shrink-0" strokeWidth={2.2} aria-hidden />
				{t('measure.callout', {
					exercise: exerciseLabel(STRENGTH_EXAMPLE.exercise, tExercises),
					weight: kg(weeks[weeks.length - 1]),
					change: kg(strengthChange(weeks)),
					weeks: weeks.length,
				})}
			</>
		),
		earn: (
			<>
				<RankCrest rankId={rank.id} className="size-5 shrink-0" />
				{t('earn.callout', { rank: rankText(rank, tRanks).title })}
			</>
		),
	}

	return (
		<section aria-labelledby="verbs-heading" className="site-section">
			<SiteSectionHeading id="verbs-heading" className="site-verbs-heading">
				{VERBS.map(({ key }) => (
					<span key={key} className="site-word">
						{t(`words.${key}`)}{' '}
					</span>
				))}
			</SiteSectionHeading>
			<ol className="site-verbs">
				{VERBS.map(({ key, href, Screen }, index) => (
					<li key={key} className="site-verb">
						<div className="site-verb-text">
							<p aria-hidden="true" className="site-verb-word">
								<span className="type-data text-ink-3">
									{String(index + 1).padStart(2, '0')}
								</span>
								<span className="type-page">{t(`words.${key}`)}</span>
							</p>
							<h3 className="type-panel site-verb-title">
								{t(`${key}.title`)}
							</h3>
							<p className="type-site-lead site-body">
								{t(`${key}.body`, { ranks: LANDING_FACTS.ranks })}
							</p>
							<Link href={href} className="type-action site-link">
								{t(`${key}.link`)}
								<ArrowRight className="size-4" aria-hidden />
							</Link>
						</div>
						<div className="site-verb-stage">
							<SitePhoneFrame example={tMock('example')}>
								<Screen />
							</SitePhoneFrame>
							<p aria-hidden="true" className="site-callout">
								{callouts[key]}
							</p>
						</div>
					</li>
				))}
			</ol>
		</section>
	)
}
