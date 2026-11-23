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

import { motionVars, SitePhoneFrame, SiteSectionHeading } from './site-parts'
import {
	EarnScreen,
	MeasureScreen,
	PlanScreen,
	TrainScreen,
} from './verb-screens'

/**
 * SITE-01 §12.4: the whole product in four moves, each proven by the app's
 * own screen and sent to its feature page. Four phones in a row on desktop,
 * playing their scripts one after another; two by two on tablets; a swipe row
 * on phones, each playing as it comes into view. The owner replaced the
 * sticky stage on 2026-11-22: scrolling through four screens of it was too
 * long. No filled action: the links are link-style.
 */
/**
 * Where each phone's script starts, in seconds: as the one before it settles,
 * never after a pause (the owner, 2026-11-22: waiting two seconds between
 * phones read as the page stalling). Each start is the previous script's last
 * frame less a short overlap; the scripts' timings are in globals.css (§12.4).
 */
const SEQ_SECONDS = [0, 1.15, 3.6, 6.5] as const
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
			<SiteSectionHeading id="verbs-heading">{t('heading')}</SiteSectionHeading>
			<ol
				className="site-verbs"
				data-play-when="0.3"
				data-loop="12000"
				data-play-media="(min-width: 1280px)"
			>
				{VERBS.map(({ key, href, Screen }, index) => (
					<li
						key={key}
						className="site-verb"
						data-reveal="up"
						data-play-when="0.5"
						data-loop="6500"
						data-play-media="(max-width: 1279px)"
						style={motionVars({
							'--seq': `${SEQ_SECONDS[index]}s`,
							'--delay': `${index * 120}ms`,
						})}
					>
						<p aria-hidden="true" className="site-verb-word">
							<span className="type-data">
								{String(index + 1).padStart(2, '0')}
							</span>
							<span className="type-page">{t(`words.${key}`)}</span>
						</p>
						<div className="site-verb-stage">
							<SitePhoneFrame>
								<Screen />
							</SitePhoneFrame>
							<p aria-hidden="true" className="site-callout">
								{callouts[key]}
							</p>
						</div>
						<h3 className="type-panel site-verb-title">{t(`${key}.title`)}</h3>
						<p className="type-body site-body">
							{t(`${key}.body`, { ranks: LANDING_FACTS.ranks })}
						</p>
						<Link href={href} className="type-action site-link">
							{t(`${key}.link`)}
							<ArrowRight className="size-4" aria-hidden />
						</Link>
					</li>
				))}
			</ol>
		</section>
	)
}
