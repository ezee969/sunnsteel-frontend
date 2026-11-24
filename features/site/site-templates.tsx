import { LP_STEPS } from '@sunsteel/contracts'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'

import type { Locale } from '@/i18n/config'
import { dateFormatter, numberFormatter } from '@/i18n/date-locale'
import {
	TEMPLATE_LEVELS,
	type TemplateLevel,
	templatesForLevel,
	templateWeekdays,
} from '@/lib/site/landing-examples'
import {
	ROUTINE_TEMPLATES,
	type RoutineTemplate,
	templateDayName,
	templateText,
} from '@/lib/utils/routine-templates'

import { motionVars, PlanTag, SiteCard, SiteSectionHeading } from './site-parts'
import { SiteTemplateCarousel } from './site-template-carousel'

/**
 * SITE-01 §12.8: from "this looks good" to "this is my plan". The templates
 * are the app's own (`ROUTINE_TEMPLATES` and its messages), never retyped;
 * Advanced, which has no starter template, shows the 8-week block (Pro) from
 * contracts' `LP_STEPS`. This is the plain list the section shows without
 * JavaScript, which the motion phase turns into the level tabs and the
 * coverflow. "Start with this one" carries the template's slug into sign-up.
 * "None of these?" is a line under the cards for every level (the owner,
 * 2026-11-22: as a card in the coverflow it read as a broken template).
 */

/** Monday first, the builder's default order. */
const WEEK = [1, 2, 3, 4, 5, 6, 0]

export async function SiteTemplates() {
	const t = await getTranslations('site.templates')
	const tTemplates = await getTranslations('routines.templates')
	const levelOf = (slug: string) =>
		TEMPLATE_LEVELS.find(level =>
			templatesForLevel(level).some(template => template.slug === slug),
		) ?? 'beginner'

	return (
		<section aria-labelledby="templates-heading" className="site-section">
			<SiteSectionHeading id="templates-heading">
				{t('heading')}
			</SiteSectionHeading>
			<p className="type-site-lead site-body">{t('body')}</p>
			<SiteTemplateCarousel
				cards={[
					...ROUTINE_TEMPLATES.map(template => {
						const text = templateText(template, tTemplates)
						const level = levelOf(template.slug)
						return {
							id: template.slug,
							level,
							name: text.name,
							node: <TemplateCardNode template={template} level={level} />,
						}
					}),
					{
						id: 'block',
						level: 'advanced' as const,
						name: t('block.name'),
						node: <BlockCardNode />,
					},
				]}
			/>
			<div className="site-none-fit">
				<p className="type-panel">{t('noneFit.title')}</p>
				<Link href="/signup" className="type-action site-link mt-0">
					{t('noneFit.build')}
					<ArrowRight className="size-4" aria-hidden />
				</Link>
				<p className="flex items-center gap-3">
					<Link
						href="/features/routine-builder"
						className="type-action site-link mt-0"
					>
						{t('noneFit.describe')}
						<ArrowRight className="size-4" aria-hidden />
					</Link>
					<PlanTag>{t('pro')}</PlanTag>
				</p>
			</div>
		</section>
	)
}

/**
 * One template's card, as the landing's coverflow shows it and the use-case
 * pages (§12.17) reuse it: its level, name, week and days, and the hand-off
 * into sign-up. `heading` is `p` where the card stands before the page's
 * first `h2` (a use-case page's header), so the outline never skips a level.
 */
export async function TemplateCardNode({
	template,
	level,
	heading: Heading = 'h3',
}: {
	template: RoutineTemplate
	level: TemplateLevel
	heading?: 'h3' | 'p'
}) {
	const t = await getTranslations('site.templates')
	const tTemplates = await getTranslations('routines.templates')
	const locale = (await getLocale()) as Locale
	const letter = dateFormatter(locale, { weekday: 'narrow' })
	// 2026-11-15 was a Sunday: day N of that week is weekday N.
	const weekday = (day: number) => letter.format(new Date(2026, 10, 15 + day))
	const text = templateText(template, tTemplates)
	const days = templateWeekdays(template)
	return (
		<SiteCard as="article" className="site-template">
			<p className="type-label text-ink-3">{t(`levels.${level}`)}</p>
			<Heading className="type-panel">{text.name}</Heading>
			<p className="type-body-sm text-ink-2">{text.summary}</p>
			<ol aria-hidden="true" className="site-week-strip">
				{WEEK.map((day, index) => (
					<li
						key={day}
						data-on={days.includes(day) || undefined}
						style={motionVars({ '--d': index })}
					>
						{weekday(day)}
					</li>
				))}
			</ol>
			<ul className="site-template-days">
				{template.days.map((day, index) => (
					<li
						key={day.key}
						className="site-screen-row"
						style={motionVars({ '--d': index })}
					>
						<span>{templateDayName(day, tTemplates)}</span>
						<span className="type-body-sm text-ink-3">
							{t('exercises', { count: day.exercises.length })}
						</span>
					</li>
				))}
			</ul>
			<p className="type-body-sm text-ink-2">{text.description}</p>
			<Link
				href={`/signup?template=${template.slug}`}
				className="type-action site-outline site-template-start"
			>
				{t('start')}
			</Link>
		</SiteCard>
	)
}

/** Advanced's card: the 8-week block (Pro), from contracts' `LP_STEPS`. */
export async function BlockCardNode({
	heading: Heading = 'h3',
}: {
	heading?: 'h3' | 'p'
} = {}) {
	const t = await getTranslations('site.templates')
	const locale = (await getLocale()) as Locale
	const percent = numberFormatter(locale, { style: 'percent' })
	const firstStep = LP_STEPS[0]
	const lastStep = LP_STEPS[LP_STEPS.length - 1]
	return (
		<SiteCard as="article" className="site-template">
			<p className="type-label text-ink-3">{t('levels.advanced')}</p>
			<div className="flex items-start justify-between gap-3">
				<Heading className="type-panel">{t('block.name')}</Heading>
				<PlanTag>{t('pro')}</PlanTag>
			</div>
			{/* The range is said once, in the summary (the owner, 2026-11-23);
			    the bars below show it and are hidden from screen readers. */}
			<p className="type-body-sm text-ink-2">
				{t('block.summary', {
					weeks: LP_STEPS.length,
					first: percent.format(firstStep.percentage),
					last: percent.format(lastStep.percentage),
				})}
			</p>
			<figure className="site-block">
				<ol aria-hidden="true" className="site-block-bars">
					{LP_STEPS.map((step, index) => (
						<li
							key={step.step}
							style={motionVars({
								'--d': index,
								'--h': step.percentage,
							})}
						>
							<span>{percent.format(step.percentage)}</span>
							<span className="site-block-track">
								<span className="site-block-fill" />
							</span>
							<span>{t('block.week', { number: step.step })}</span>
						</li>
					))}
				</ol>
			</figure>
			<p className="type-body-sm text-ink-2">{t('block.sets')}</p>
			<Link href="/signup?plan=pro" className="type-action site-outline">
				{t('block.start')}
			</Link>
		</SiteCard>
	)
}
