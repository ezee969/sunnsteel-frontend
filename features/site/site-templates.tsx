import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'

import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import {
	TEMPLATE_LEVELS,
	templatesForLevel,
	templateWeekdays,
} from '@/lib/site/landing-examples'
import {
	ROUTINE_TEMPLATES,
	templateDayName,
	templateText,
} from '@/lib/utils/routine-templates'

import { PlanTag, SiteCard, SiteSectionHeading } from './site-parts'

/**
 * SITE-01 §12.8: from "this looks good" to "this is my plan". The templates
 * are the app's own (`ROUTINE_TEMPLATES` and its messages), never retyped.
 * This is the plain list the section shows without JavaScript -- every
 * template with its level, then "none of these?" -- which the motion phase
 * turns into the level tabs and the coverflow. "Start with this one" carries
 * the template's slug into sign-up.
 */

/** Monday first, the builder's default order. */
const WEEK = [1, 2, 3, 4, 5, 6, 0]

export async function SiteTemplates() {
	const t = await getTranslations('site.templates')
	const tTemplates = await getTranslations('routines.templates')
	const locale = (await getLocale()) as Locale
	const letter = dateFormatter(locale, { weekday: 'narrow' })
	// 2026-11-15 was a Sunday: day N of that week is weekday N.
	const weekday = (day: number) => letter.format(new Date(2026, 10, 15 + day))
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
			<ul className="site-templates">
				{ROUTINE_TEMPLATES.map(template => {
					const text = templateText(template, tTemplates)
					const days = templateWeekdays(template)
					return (
						<SiteCard as="li" key={template.slug} className="site-template">
							<p className="type-label text-ink-3">
								{t(`levels.${levelOf(template.slug)}`)}
							</p>
							<h3 className="type-panel">{text.name}</h3>
							<p className="type-body-sm text-ink-2">{text.summary}</p>
							<ol aria-hidden="true" className="site-week-strip">
								{WEEK.map(day => (
									<li key={day} data-on={days.includes(day) || undefined}>
										{weekday(day)}
									</li>
								))}
							</ol>
							<ul className="site-template-days">
								{template.days.map(day => (
									<li key={day.key} className="site-screen-row">
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
								className="type-action site-outline"
							>
								{t('start')}
							</Link>
						</SiteCard>
					)
				})}
				<SiteCard as="li" className="site-template">
					<h3 className="type-panel">{t('noneFit.title')}</h3>
					<Link href="/signup" className="type-action site-outline">
						{t('noneFit.build')}
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
					<p className="flex items-start justify-between gap-3">
						<span className="type-body-sm text-ink-2">
							<span className="type-label mb-1 block text-ink-3">
								{t('levels.advanced')}
							</span>
							{t('noneFit.advanced')}
						</span>
						<PlanTag>{t('pro')}</PlanTag>
					</p>
				</SiteCard>
			</ul>
		</section>
	)
}
