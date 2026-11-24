import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import type { Locale } from '@/i18n/config'
import {
	type TemplateLevel,
	templatesForLevel,
} from '@/lib/site/landing-examples'
import { templateText } from '@/lib/utils/routine-templates'

import { PlanTag } from '../site-parts'
import { BlockCardNode, TemplateCardNode } from '../site-templates'
import {
	type Crumb,
	SitePageHeader,
	SitePageQuestions,
	SitePageSection,
	SitePageShell,
	updatedOn,
} from './site-page'

/**
 * SITE-01 §12.17-§12.18: the three use-case pages on one template -- a Night
 * header with the level's own program card, the facts of that program,
 * what changes at this level, the program itself, the tools that matter,
 * the steps to the next level and the questions. "What changes" is general
 * training sense, checked in the copy deck: no medical claims, no promised
 * results.
 */
export const USE_CASE_SLUGS = [
	'beginners',
	'intermediates',
	'advanced',
] as const
export type UseCaseSlug = (typeof USE_CASE_SLUGS)[number]

const UPDATED = '2026-11'

const LEVEL: Record<UseCaseSlug, TemplateLevel> = {
	beginners: 'beginner',
	intermediates: 'intermediate',
	advanced: 'advanced',
}

type Plan = 'free' | 'freePro' | 'pro'

/** Each level's tools: a feature page, its label and its plan. */
const TOOLS: Record<
	UseCaseSlug,
	Array<{ label: string; ownLabel?: boolean; href: string; plan: Plan }>
> = {
	beginners: [
		{
			label: 'workoutTracker',
			href: '/features/workout-tracker',
			plan: 'free',
		},
		{ label: 'progression', href: '/features/progression', plan: 'freePro' },
		{ label: 'ranks', href: '/features/ranks', plan: 'free' },
		{
			label: 'routineBuilder',
			href: '/features/routine-builder',
			plan: 'freePro',
		},
	],
	intermediates: [
		{
			label: 'bodyMap',
			ownLabel: true,
			href: '/features/progress',
			plan: 'freePro',
		},
		{
			label: 'plateaus',
			ownLabel: true,
			href: '/features/progress',
			plan: 'free',
		},
		{
			label: 'versions',
			ownLabel: true,
			href: '/features/routine-builder',
			plan: 'freePro',
		},
		{
			label: 'supersets',
			ownLabel: true,
			href: '/features/routine-builder',
			plan: 'free',
		},
	],
	advanced: [
		{
			label: 'eightWeek',
			ownLabel: true,
			href: '/features/progression',
			plan: 'pro',
		},
		{
			label: 'trainingBlocks',
			ownLabel: true,
			href: '/features/routine-builder',
			plan: 'pro',
		},
		{
			label: 'deloads',
			ownLabel: true,
			href: '/features/routine-builder',
			plan: 'pro',
		},
		{
			label: 'signals',
			ownLabel: true,
			href: '/features/progress',
			plan: 'pro',
		},
		{
			label: 'review',
			ownLabel: true,
			href: '/features/progress',
			plan: 'pro',
		},
	],
}

const NEXT: Record<UseCaseSlug, string> = {
	beginners: '/use-cases/intermediates',
	intermediates: '/use-cases/advanced',
	advanced: '/features',
}

const FAQ: Record<UseCaseSlug, string[]> = {
	beginners: ['gym', 'weights'],
	intermediates: ['split'],
	advanced: ['template'],
}

type PageTranslator = (
	key: string,
	values?: Record<string, string | number>,
) => string

export async function UseCasePage({
	slug,
	locale,
}: {
	slug: UseCaseSlug
	locale: Locale
}) {
	// Built from the level at runtime; `messages.test.ts` holds every key.
	const t = (await getTranslations(
		`sitePages.useCases.${slug}`,
	)) as unknown as PageTranslator
	const tCases = await getTranslations('sitePages.useCases')
	const tShared = await getTranslations('sitePages.shared')
	const tBar = await getTranslations('site.topBar')
	const tTemplates = await getTranslations('routines.templates')
	const level = LEVEL[slug]
	const templates = templatesForLevel(level)
	const first = templates[0]
	const crumbs: Crumb[] = [
		{ label: tShared('breadcrumb.useCases') },
		{ label: tBar(`links.${slug}`), href: `/use-cases/${slug}` },
	]
	const primary = first
		? {
				label: tCases('shared.startWith', {
					template: templateText(first, tTemplates).name,
				}),
				href: `/signup?template=${first.slug}`,
			}
		: { label: tShared('startFree'), href: '/signup' }

	return (
		<SitePageShell crumbs={crumbs}>
			<SitePageHeader
				crumbs={crumbs}
				eyebrow={t('eyebrow')}
				title={t('heading')}
				subline={t('subline')}
				updated={updatedOn(locale, UPDATED)}
				actions={{
					primary,
					secondary: { label: tCases('shared.seeFeatures'), href: '/features' },
				}}
				facts={[t('audience'), ...t('facts').split(' · ')]}
				aside={
					<div className="site-page-card-aside" data-play-when="0.4">
						{first ? (
							<TemplateCardNode template={first} level={level} heading="p" />
						) : (
							<BlockCardNode heading="p" />
						)}
					</div>
				}
			/>

			<SitePageSection id="changes" heading={tCases('shared.whatChanges')}>
				<ol className="site-page-cards site-page-cards-four">
					{[1, 2, 3, 4].map(index => (
						<li key={index} className="site-card site-page-card">
							<span className="type-data site-page-step-number">
								{String(index).padStart(2, '0')}
							</span>
							<p className="type-panel mt-2 text-foreground">
								{t(`changes.${index}.title`)}
							</p>
							<p className="type-body mt-2 text-ink-2">
								{t(`changes.${index}.body`)}
							</p>
						</li>
					))}
				</ol>
			</SitePageSection>

			<SitePageSection id="program" heading={tCases('shared.program')}>
				<div className="site-page-programs" data-play-when="0.3">
					{templates.length ? (
						templates.map(template => (
							<TemplateCardNode
								key={template.slug}
								template={template}
								level={level}
							/>
						))
					) : (
						<BlockCardNode />
					)}
				</div>
			</SitePageSection>

			<SitePageSection id="tools" heading={tCases('shared.tools')}>
				<ul className="site-page-cards site-page-cards-four">
					{TOOLS[slug].map(tool => (
						<li key={tool.label}>
							<Link href={tool.href} className="site-card site-feature-card">
								<span className="site-feature-card-head">
									<span />
									<PlanTag>{tShared(`tags.${tool.plan}`)}</PlanTag>
								</span>
								<span className="type-page block text-foreground">
									{tool.ownLabel
										? tCases(`tools.${tool.label}` as 'tools.bodyMap')
										: tBar(`links.${tool.label}` as 'links.ranks')}
								</span>
								<ArrowRight
									className="site-feature-card-arrow size-4"
									aria-hidden
								/>
							</Link>
						</li>
					))}
				</ul>
			</SitePageSection>

			<SitePageSection id="steps" heading={tCases('shared.stepByStep')}>
				<ol className="site-page-steps">
					{[1, 2, 3, 4, 5].map(index => (
						<li key={index}>
							<span className="type-data site-page-step-number">
								{String(index).padStart(2, '0')}
							</span>
							<span className="type-body text-foreground">
								{t(`steps.${index}`)}
							</span>
						</li>
					))}
				</ol>
			</SitePageSection>

			<SitePageSection id="next" heading={tCases('shared.next')}>
				<Link
					href={NEXT[slug]}
					className="site-card site-feature-card site-page-next"
				>
					<span className="type-page block text-foreground">{t('next')}</span>
					<ArrowRight className="site-feature-card-arrow size-4" aria-hidden />
				</Link>
			</SitePageSection>

			<SitePageQuestions
				items={FAQ[slug].map(id => ({
					id: `faq-${id}`,
					question: t(`faq.${id}.q`),
					answer: t(`faq.${id}.a`),
					plain: t(`faq.${id}.a`),
				}))}
			/>
		</SitePageShell>
	)
}
