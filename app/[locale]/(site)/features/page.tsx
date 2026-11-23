import { ACHIEVEMENT_DEFINITIONS } from '@sunsteel/contracts'
import {
	ArrowRight,
	ChartColumn,
	ClipboardList,
	Dumbbell,
	Medal,
	TrendingUp,
	Users,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { ReactNode } from 'react'

import { PlanComparisonTable } from '@/features/billing/plan-comparison-table'
import {
	plainTags,
	SitePageHeader,
	sitePageMetadata,
	SitePageQuestions,
	SitePageSection,
	SitePageShell,
	updatedOn,
} from '@/features/site/pages/site-page'
import { motionVars, PlanTag } from '@/features/site/site-parts'
import type { Locale } from '@/i18n/config'
import { LANDING_FACTS } from '@/lib/site/landing-examples'
import { CATALOG_FLOOR } from '@/lib/site/proof-figures'

/**
 * SITE-01 §12.19: every feature on one page -- the six feature pages under
 * the four verbs and training with people, each with its plan, then the
 * whole of Free and Pro in the very table `/plans` renders. The owner's
 * 2026-11-23 word on languages ("nobody is concerned about them") keeps
 * them out of the facts band.
 */
const UPDATED = '2026-11'

const GROUPS = [
	{
		id: 'plan',
		cards: [
			{
				key: 'routineBuilder',
				href: '/features/routine-builder',
				plan: 'freePro',
				Icon: ClipboardList,
			},
			{
				key: 'progression',
				href: '/features/progression',
				plan: 'freePro',
				Icon: TrendingUp,
			},
		],
	},
	{
		id: 'train',
		cards: [
			{
				key: 'workoutTracker',
				href: '/features/workout-tracker',
				plan: 'free',
				Icon: Dumbbell,
			},
		],
	},
	{
		id: 'measure',
		cards: [
			{
				key: 'progress',
				href: '/features/progress',
				plan: 'freePro',
				Icon: ChartColumn,
			},
		],
	},
	{
		id: 'earn',
		cards: [
			{ key: 'ranks', href: '/features/ranks', plan: 'free', Icon: Medal },
		],
	},
	{
		id: 'people',
		cards: [
			{
				key: 'community',
				href: '/features/community',
				plan: 'free',
				Icon: Users,
			},
		],
	},
] as const

const CARDS = GROUPS.flatMap(group =>
	group.cards.map(card => ({ ...card, group: group.id })),
)

const FAQ = ['free', 'install', 'data'] as const

type Params = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
	const { locale } = await params
	const t = await getTranslations({
		locale: locale as Locale,
		namespace: 'sitePages.featuresIndex',
	})
	return sitePageMetadata({
		title: t('meta.title'),
		description: t('meta.description'),
		path: '/features',
	})
}

export default async function FeaturesPage({ params }: Params) {
	const { locale } = await params
	setRequestLocale(locale as Locale)
	const t = await getTranslations('sitePages.featuresIndex')
	const tShared = await getTranslations('sitePages.shared')
	const tBar = await getTranslations('site.topBar')
	const tPlans = await getTranslations('billing.plans')
	const crumbs = [{ label: tShared('breadcrumb.features'), href: '/features' }]

	const installLink = (chunks: ReactNode) => (
		<Link href="/#install" className="site-inline-link">
			{chunks}
		</Link>
	)

	return (
		<SitePageShell crumbs={crumbs}>
			<SitePageHeader
				crumbs={crumbs}
				title={t('heading')}
				subline={t('subline')}
				updated={updatedOn(locale as Locale, UPDATED)}
				actions={{
					primary: { label: tShared('startFree'), href: '/signup' },
					secondary: { label: tShared('seePricing'), href: '/pricing' },
				}}
				facts={[
					t('facts.free'),
					t('facts.exercises', { count: CATALOG_FLOOR }),
					t('facts.browser'),
				]}
			/>

			<section
				aria-label={t('heading')}
				className="site-section site-page-section"
			>
				{/* One grid of the six, each labelled with its verb: grouped rows
				    left most of the width empty. */}
				<ul className="site-feature-cards" data-reveal="stagger">
					{CARDS.map(({ key, href, plan, Icon, group }, index) => (
						<li key={key} style={motionVars({ '--i': index })}>
							<Link href={href} className="site-card site-feature-card">
								<span className="site-feature-card-head">
									<span className="site-feature-card-verb">
										<Icon className="size-4" aria-hidden />
										{t(`groups.${group}`)}
									</span>
									<PlanTag>{tShared(`tags.${plan}`)}</PlanTag>
								</span>
								<span className="type-page block text-foreground">
									{tBar(`links.${key}`)}
								</span>
								<span className="type-body block text-ink-2">
									{t(`cards.${key}`, {
										ranks: LANDING_FACTS.ranks,
										milestones: ACHIEVEMENT_DEFINITIONS.length,
									})}
								</span>
								<ArrowRight
									className="site-feature-card-arrow size-4"
									aria-hidden
								/>
							</Link>
						</li>
					))}
				</ul>
			</section>

			<SitePageSection id="glance" heading={t('glance.heading')}>
				<p className="type-body site-page-note">{t('glance.caption')}</p>
				<PlanComparisonTable />
				<p className="type-body site-page-note">
					<span className="type-label block text-ink-3">
						{tPlans('alwaysFreeTitle')}
					</span>
					{tPlans('alwaysFree')}
				</p>
				<p className="type-body site-page-note">
					{t.rich('pricingLine', {
						link: chunks => (
							<Link href="/pricing" className="site-inline-link">
								{chunks}
							</Link>
						),
					})}
				</p>
			</SitePageSection>

			<SitePageQuestions
				items={FAQ.map(key => ({
					id: `faq-${key}`,
					question: t(`faq.${key}.q`),
					answer:
						key === 'install'
							? t.rich('faq.install.a', { link: installLink })
							: t(`faq.${key}.a`),
					plain:
						key === 'install'
							? t.markup('faq.install.a', plainTags(['link']))
							: t(`faq.${key}.a`),
				}))}
			/>
		</SitePageShell>
	)
}
