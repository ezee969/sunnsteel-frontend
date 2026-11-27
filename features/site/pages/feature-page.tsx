import {
	ACHIEVEMENT_DEFINITIONS,
	ACTIVITY_REACTIONS,
	COMEBACK_MIN_INACTIVE_DAYS,
	COMEBACK_REQUIRED_ACTIVE_DAYS,
	COMEBACK_WINDOW_DAYS,
	CUSTOM_EXERCISES_MAX,
	FEATURED_PROFILE_ITEMS_MAX,
	FREE_STRENGTH_RANGE_DAYS,
	LP_STEPS,
	LP_WORKING_SETS,
	MESSAGE_BODY_MAX,
	MESSAGE_REPORT_CONTEXT_BEFORE,
	PLANS,
	ROUTINE_DAYS_MAX,
	SESSION_CORRECTION_WINDOW_HOURS,
	TRAINING_PARTNERS_MAX,
} from '@sunsteel/contracts'
import { ArrowRight, ArrowUp, Check } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { rankText } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { numberFormatter } from '@/i18n/date-locale'
import {
	BENCH_ON_MAP,
	BLOCK_TABLE,
	LEDGER_TABLE,
	MAX_EXTRA_SETS,
	MILESTONES_BY_CATEGORY,
	NAMED_SET_KINDS,
	UPPER_LOWER_WEEKLY_SETS,
	WARM_UP_TABLE,
} from '@/lib/site/feature-examples'
import { LANDING_FACTS, LEDGER_RANGE, RANKS } from '@/lib/site/landing-examples'
import { getFriendlyMuscleName } from '@/lib/utils/muscle-groups'
import { PRIVACY_SECTION_LABEL_KEYS } from '@/lib/utils/privacy-overview'
import { ROUTINE_TEMPLATES } from '@/lib/utils/routine-templates'
import { formatWeight } from '@/lib/utils/weight-unit'

import { PlanTag, SitePhoneFrame } from '../site-parts'
import {
	EarnScreen,
	MeasureScreen,
	PlanScreen,
	TrainScreen,
} from '../verb-screens'
import {
	type Crumb,
	SitePageHeader,
	SitePageQuestions,
	SitePageSection,
	SitePageShell,
	updatedOn,
} from './site-page'

/**
 * SITE-01 §12.15-§12.16: the six feature pages on one template -- a Night
 * header with the feature's phone, then overview, how it works, a worked
 * example computed by the app's own rule, what is free and what is Pro, tips,
 * related pages and the questions. Every number is an argument from code.
 */
export const FEATURE_SLUGS = [
	'workout-tracker',
	'routine-builder',
	'progression',
	'progress',
	'ranks',
	'community',
] as const
export type FeatureSlug = (typeof FEATURE_SLUGS)[number]

type FeatureKey =
	| 'workoutTracker'
	| 'routineBuilder'
	| 'progression'
	| 'progress'
	| 'ranks'
	| 'community'

export const FEATURE_KEY: Record<FeatureSlug, FeatureKey> = {
	'workout-tracker': 'workoutTracker',
	'routine-builder': 'routineBuilder',
	progression: 'progression',
	progress: 'progress',
	ranks: 'ranks',
	community: 'community',
}

type PageTranslator = (
	key: string,
	values?: Record<string, string | number>,
) => string

/** The month each page's content last changed (§12.14's "Updated" line). */
const UPDATED = '2026-11'

const PLAN: Record<FeatureKey, 'free' | 'freePro'> = {
	workoutTracker: 'free',
	routineBuilder: 'freePro',
	progression: 'freePro',
	progress: 'freePro',
	ranks: 'free',
	community: 'free',
}

const RELATED: Record<
	FeatureKey,
	[FeatureSlug, FeatureSlug, 'beginners' | 'intermediates' | 'advanced']
> = {
	workoutTracker: ['progression', 'progress', 'beginners'],
	routineBuilder: ['progression', 'workout-tracker', 'intermediates'],
	progression: ['workout-tracker', 'routine-builder', 'advanced'],
	progress: ['progression', 'ranks', 'intermediates'],
	ranks: ['workout-tracker', 'community', 'beginners'],
	community: ['ranks', 'progress', 'beginners'],
}

const HIGHLIGHTS: Record<FeatureKey, string[]> = {
	workoutTracker: ['last', 'rest', 'plates'],
	routineBuilder: ['schedule', 'templates', 'summary'],
	progression: ['double', 'perSet', 'block'],
	progress: ['strength', 'map', 'plateaus'],
	ranks: ['ranks', 'milestones', 'comebacks'],
	community: ['activity', 'partners', 'messages'],
}

const FAQ: Record<FeatureKey, string[]> = {
	workoutTracker: ['locked', 'signal', 'add', 'fix', 'forgot'],
	routineBuilder: ['rotation', 'share', 'versions', 'draft'],
	progression: ['miss', 'off', 'step', 'deload'],
	progress: ['e1rm', 'bodyweight', 'signals', 'pro'],
	ranks: ['earned', 'comeback', 'who', 'records'],
	community: ['encrypted', 'who', 'share', 'blocks'],
}

const STEPS: Record<FeatureKey, number> = {
	workoutTracker: 5,
	routineBuilder: 5,
	progression: 4,
	progress: 5,
	ranks: 4,
	community: 4,
}

const TIPS: Record<FeatureKey, number> = {
	workoutTracker: 4,
	routineBuilder: 3,
	progression: 3,
	progress: 3,
	ranks: 2,
	community: 2,
}

/** The arguments any of a page's messages may read, all from code. */
function values(locale: Locale) {
	const first = RANKS[0]
	const last = RANKS[RANKS.length - 1]
	return {
		step: formatWeight(LANDING_FACTS.step, 'KG', locale),
		hours: SESSION_CORRECTION_WINDOW_HOURS,
		max: 0,
		count: 0,
		free: PLANS.FREE.limits.ROUTINE_VERSIONS ?? 0,
		pro: PLANS.PRO.limits.ROUTINE_VERSIONS ?? 0,
		drafts: LANDING_FACTS.proDrafts,
		days: FREE_STRENGTH_RANGE_DAYS,
		freeGoals: PLANS.FREE.limits.GOALS ?? 0,
		proGoals: PLANS.PRO.limits.GOALS ?? 0,
		weeks: LP_STEPS.length,
		sets: LP_WORKING_SETS,
		ranks: RANKS.length,
		milestones: ACHIEVEMENT_DEFINITIONS.length,
		first: first.title,
		last: last.title,
		away: COMEBACK_MIN_INACTIVE_DAYS,
		active: COMEBACK_REQUIRED_ACTIVE_DAYS,
		window: COMEBACK_WINDOW_DAYS,
		reactions: ACTIVITY_REACTIONS.length,
		context: MESSAGE_REPORT_CONTEXT_BEFORE,
	}
}

/** A ruled table of a worked example, its caption above it. */
function ExampleTable({
	caption,
	columns,
	rows,
}: {
	caption: string
	columns: string
	rows: ReactNode[][]
}) {
	const heads = columns.split(' · ')
	return (
		<div className="site-example">
			<table className="site-example-table">
				<caption>{caption}</caption>
				<thead>
					<tr>
						{heads.map(head => (
							<th key={head} scope="col">
								{head}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, index) => (
						<tr key={index}>
							{row.map((cell, cellIndex) =>
								cellIndex === 0 ? (
									<th key={cellIndex} scope="row">
										{cell}
									</th>
								) : (
									<td key={cellIndex}>{cell}</td>
								),
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

/** The header's phone, its script played as on the landing. */
function HeaderPhone({ children }: { children: ReactNode }) {
	return (
		<div className="site-page-phone" data-play-when="0.4" data-loop="9000">
			<SitePhoneFrame>{children}</SitePhoneFrame>
		</div>
	)
}

async function LedgerScreen({ locale }: { locale: Locale }) {
	const tExercises = await getTranslations('catalog.exercises')
	const kg = (value: number) => formatWeight(value, 'KG', locale)
	return (
		<>
			<p className="site-screen-title">{tExercises('Bench Press')}</p>
			<p className="site-screen-caption">
				3 × {LEDGER_RANGE.min}–{LEDGER_RANGE.max} · +{kg(LANDING_FACTS.step)}
			</p>
			<ul className="site-screen-rows">
				{LEDGER_TABLE.map((row, index) => (
					<li
						key={row.workout}
						className="site-screen-row sx-row"
						style={{ ['--i' as string]: index }}
					>
						<span className="type-data">{kg(row.weightKg)}</span>
						<span className="type-data text-ink-2">{row.reps.join(' · ')}</span>
						{row.nextKg > row.weightKg ? (
							<ArrowUp className="size-4 text-foreground" aria-hidden />
						) : null}
					</li>
				))}
			</ul>
		</>
	)
}

async function PrivacyScreen() {
	const t = await getTranslations('settings.privacyOverview')
	// A synthetic member's choices, one of each audience.
	const audience = [
		'PUBLIC',
		'FOLLOWERS',
		'PUBLIC',
		'FOLLOWERS',
		'PUBLIC',
		'PRIVATE',
		'PRIVATE',
	] as const
	const parts = Object.values(PRIVACY_SECTION_LABEL_KEYS).slice(
		0,
		audience.length,
	)
	return (
		<>
			<p className="site-screen-title">{t('title')}</p>
			<ul className="site-screen-rows">
				{parts.map((key, index) => (
					<li
						key={key}
						className="site-screen-row sx-row"
						style={{ ['--i' as string]: index }}
					>
						<span>{t(key)}</span>
						<span className="type-data text-ink-2">
							{t(`audience.${audience[index]}`)}
						</span>
					</li>
				))}
			</ul>
		</>
	)
}

export async function FeaturePage({
	slug,
	locale,
}: {
	slug: FeatureSlug
	locale: Locale
}) {
	const key = FEATURE_KEY[slug]
	// The page's keys are built from its id at runtime, past what the typed
	// translator can follow; `messages.test.ts` holds that every one exists
	// in both languages.
	const t = (await getTranslations(
		`sitePages.features.${key}`,
	)) as unknown as PageTranslator
	const tShared = await getTranslations('sitePages.shared')
	const tBar = await getTranslations('site.topBar')
	const tUseCase = await getTranslations('site.topBar.links')
	const tRanks = await getTranslations('catalog.ranks')
	const tSettings = await getTranslations('settings')
	const tAchievements = await getTranslations('achievements')
	const tMuscles = await getTranslations('routines.muscles')
	const v = values(locale)
	const kg = (value: number) => formatWeight(value, 'KG', locale)
	const percent = numberFormatter(locale, { style: 'percent' })
	const decimal = numberFormatter(locale, { maximumFractionDigits: 1 })
	const crumbs: Crumb[] = [
		{ label: tShared('breadcrumb.features'), href: '/features' },
		{ label: tBar(`links.${key}`), href: `/features/${slug}` },
	]

	// Each page's own facts, each from code.
	const facts: Record<FeatureKey, () => string[]> = {
		workoutTracker: () => [
			t('facts.plan'),
			t('facts.kinds', { count: NAMED_SET_KINDS.length }),
			t('facts.extra', { max: MAX_EXTRA_SETS }),
			t('facts.corrections', { hours: SESSION_CORRECTION_WINDOW_HOURS }),
		],
		routineBuilder: () => [
			t('facts.days', { max: ROUTINE_DAYS_MAX }),
			t('facts.versions', { free: v.free, pro: v.pro }),
			t('facts.custom', { max: CUSTOM_EXERCISES_MAX }),
			t('facts.drafts', { count: v.drafts }),
		],
		progression: () => [
			t('facts.step', { step: v.step }),
			t('facts.schemes'),
			t('facts.block', { weeks: v.weeks, sets: v.sets }),
			t('facts.deload'),
		],
		progress: () => [
			t('facts.strength', { days: v.days }),
			t('facts.muscles', {
				free: LANDING_FACTS.muscleWeeksFree,
				pro: LANDING_FACTS.muscleWeeksPro,
			}),
			t('facts.goals', { free: v.freeGoals, pro: v.proGoals }),
			t('facts.reviews', { count: LANDING_FACTS.proReviews }),
		],
		ranks: () => [
			t('facts.comeback', { active: v.active, window: v.window, away: v.away }),
			t('facts.featured', { max: FEATURED_PROFILE_ITEMS_MAX }),
			t('facts.plan'),
		],
		community: () => [
			t('facts.privacy', { count: LANDING_FACTS.privacyParts }),
			t('facts.partners', { max: TRAINING_PARTNERS_MAX }),
			t('facts.message', { max: MESSAGE_BODY_MAX }),
			t('facts.plan'),
		],
	}

	const highlightValues = {
		...v,
		count: ROUTINE_TEMPLATES.length,
		max: TRAINING_PARTNERS_MAX,
		first: rankText(RANKS[0], tRanks).title,
		last: rankText(RANKS[RANKS.length - 1], tRanks).title,
	}

	const asides: Record<FeatureKey, ReactNode> = {
		workoutTracker: <TrainScreen />,
		routineBuilder: <PlanScreen />,
		progression: <LedgerScreen locale={locale} />,
		progress: <MeasureScreen />,
		ranks: <EarnScreen />,
		community: <PrivacyScreen />,
	}

	const examples: Record<FeatureKey, () => ReactNode> = {
		workoutTracker: () => (
			<ExampleTable
				caption={t('example.caption')}
				columns={t('example.columns')}
				rows={WARM_UP_TABLE.map((row, index) => [
					row.working ? t('example.working') : String(index + 1),
					kg(row.weightKg),
					row.reps ?? '',
					row.platesPerSide.length
						? row.platesPerSide.map(plate => decimal.format(plate)).join(' + ')
						: t('example.bar'),
				])}
			/>
		),
		routineBuilder: () => (
			<ExampleTable
				caption={t('example.caption')}
				columns={t('example.columns')}
				rows={UPPER_LOWER_WEEKLY_SETS.map(row => [
					getFriendlyMuscleName(row.muscle, tMuscles),
					decimal.format(row.sets),
				])}
			/>
		),
		progression: () => (
			<ExampleTable
				caption={t('example.caption')}
				columns={t('example.columns')}
				rows={LEDGER_TABLE.map(row => [
					String(row.workout),
					kg(row.weightKg),
					row.reps.join(' · '),
					row.nextKg > row.weightKg ? (
						<strong className="text-foreground">{kg(row.nextKg)}</strong>
					) : (
						kg(row.nextKg)
					),
				])}
			/>
		),
		progress: () => (
			<ExampleTable
				caption={t('example.caption')}
				columns={t('example.columns')}
				rows={BENCH_ON_MAP.map(row => [
					getFriendlyMuscleName(row.muscle, tMuscles),
					t(`example.${row.role}`),
					decimal.format(row.sets),
				])}
			/>
		),
		ranks: () => (
			<>
				<ExampleTable
					caption={t('example.caption')}
					columns={t('example.ladderColumns')}
					rows={RANKS.map(rank => [
						rankText(rank, tRanks).title,
						String(rank.minimumSessions),
						String(rank.minimumActiveWeeks),
						String(rank.minimumCompletedSets),
					])}
				/>
				<ExampleTable
					caption={t('example.caption')}
					columns={t('example.milestoneColumns')}
					rows={MILESTONES_BY_CATEGORY.map(row => [
						tAchievements(`categories.${row.category}`),
						row.thresholds
							.map(threshold => decimal.format(threshold))
							.join(' · '),
					])}
				/>
			</>
		),
		community: () => (
			<ExampleTable
				caption={t('example.caption')}
				columns={t('example.columns')}
				rows={(
					Object.keys(PRIVACY_SECTION_LABEL_KEYS) as Array<
						keyof typeof PRIVACY_SECTION_LABEL_KEYS
					>
				).map(part => [
					tSettings(`privacyOverview.${PRIVACY_SECTION_LABEL_KEYS[part]}`),
					tSettings(`profilePrivacy.field.${part}`),
				])}
			/>
		),
	}

	const covers: Record<FeatureKey, () => string> = {
		workoutTracker: () => t('covers.all'),
		routineBuilder: () =>
			t('covers.rows', {
				free: v.free,
				pro: v.pro,
				drafts: v.drafts,
			}),
		progression: () => t('covers.rows'),
		progress: () =>
			t('covers.rows', {
				days: v.days,
				free: LANDING_FACTS.muscleWeeksFree,
				pro: LANDING_FACTS.muscleWeeksPro,
				freeGoals: v.freeGoals,
				proGoals: v.proGoals,
			}),
		ranks: () => t('covers.all'),
		community: () => t('covers.all'),
	}

	const [relatedA, relatedB, useCase] = RELATED[key]
	const faqValues = {
		hours: v.hours,
		free: v.free,
		pro: v.pro,
		step: v.step,
		away: v.away,
		active: v.active,
		window: v.window,
		context: v.context,
	}

	return (
		<SitePageShell crumbs={crumbs}>
			<SitePageHeader
				crumbs={crumbs}
				eyebrow={tShared(`tags.${PLAN[key]}`)}
				title={t('heading')}
				subline={t('subline', highlightValues)}
				updated={updatedOn(locale, UPDATED)}
				actions={{
					primary: { label: tShared('startFree'), href: '/signup' },
					secondary: { label: tShared('seePricing'), href: '/pricing' },
				}}
				aside={<HeaderPhone>{asides[key]}</HeaderPhone>}
			/>

			<SitePageSection id="overview" heading={tShared('overview')}>
				<p className="type-site-lead site-page-lead">{t('overview')}</p>
				<ul className="site-page-cards">
					{HIGHLIGHTS[key].map(id => (
						<li key={id} className="site-card site-page-card">
							<p className="type-panel text-foreground">
								{t(`highlights.${id}.title`, highlightValues)}
							</p>
							<p className="type-body mt-2 text-ink-2">
								{t(`highlights.${id}.body`, highlightValues)}
							</p>
						</li>
					))}
				</ul>
				<ul className="site-page-facts site-page-facts-light">
					{facts[key]().map(fact => (
						<li key={fact}>{fact}</li>
					))}
				</ul>
			</SitePageSection>

			<SitePageSection id="how" heading={tShared('howItWorks')}>
				<ol className="site-page-steps">
					{Array.from({ length: STEPS[key] }, (_, index) => (
						<li key={index}>
							<span className="type-data site-page-step-number">
								{String(index + 1).padStart(2, '0')}
							</span>
							<span className="type-body text-foreground">
								{t(`steps.${index + 1}`)}
							</span>
						</li>
					))}
				</ol>
			</SitePageSection>

			<SitePageSection id="example" heading={t('example.title')}>
				{examples[key]()}
			</SitePageSection>

			{key === 'progression' ? (
				<SitePageSection id="block" heading={t('block.heading')}>
					<PlanTag>{tShared('tags.pro')}</PlanTag>
					<ExampleTable
						caption={t('block.caption')}
						columns={t('block.columns')}
						rows={BLOCK_TABLE.map(row => [
							String(row.week),
							percent.format(row.percentage),
							kg(row.loadKg),
							row.rir.map(rir => (rir === 'AMRAP' ? 'AMRAP' : rir)).join(' · '),
						])}
					/>
				</SitePageSection>
			) : null}

			{key === 'routineBuilder' ? (
				<SitePageSection id="draft" heading={t('draft.heading')}>
					<PlanTag>{tShared('tags.pro')}</PlanTag>
					<p className="type-body site-page-note">{t('draft.body')}</p>
				</SitePageSection>
			) : null}

			<SitePageSection id="covers" heading={tShared('whatItCovers')}>
				<ul className="site-page-covers">
					{covers[key]()
						.split(/(?<=\.)\s+/)
						.filter(Boolean)
						.map(line => (
							<li key={line}>
								<Check className="mt-1 size-4 shrink-0" aria-hidden />
								<span className="type-body text-foreground">{line}</span>
							</li>
						))}
				</ul>
			</SitePageSection>

			<SitePageSection id="tips" heading={tShared('tips')}>
				<ul className="site-page-tips">
					{Array.from({ length: TIPS[key] }, (_, index) => (
						<li key={index} className="type-body text-foreground">
							{t(`tips.${index + 1}`)}
						</li>
					))}
				</ul>
			</SitePageSection>

			<SitePageSection id="related" heading={tShared('related')}>
				<ul className="site-page-cards">
					{[relatedA, relatedB].map(related => (
						<li key={related}>
							<Link
								href={`/features/${related}`}
								className="site-card site-feature-card"
							>
								<span className="type-page block text-foreground">
									{tBar(`links.${FEATURE_KEY[related]}`)}
								</span>
								<ArrowRight
									className="site-feature-card-arrow size-4"
									aria-hidden
								/>
							</Link>
						</li>
					))}
					<li>
						<Link
							href={`/use-cases/${useCase}`}
							className="site-card site-feature-card"
						>
							<span className="site-feature-card-verb">
								{tShared('relatedUseCase')}
							</span>
							<span className="type-page block text-foreground">
								{tUseCase(useCase)}
							</span>
							<ArrowRight
								className="site-feature-card-arrow size-4"
								aria-hidden
							/>
						</Link>
					</li>
				</ul>
			</SitePageSection>

			<SitePageQuestions
				items={FAQ[key].map(id => ({
					id: `faq-${id}`,
					question: t(`faq.${id}.q`),
					answer: t(`faq.${id}.a`, faqValues),
					plain: t(`faq.${id}.a`, faqValues),
				}))}
			/>
		</SitePageShell>
	)
}
