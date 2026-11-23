import { ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import { PUBLIC_ORIGIN } from '@/lib/config/env'
import { siteLandingLive } from '@/lib/site/landing'
import { cn } from '@/lib/utils'

import { SiteFooter } from '../site-footer'
import { SiteMotion } from '../site-motion'
import { HeadingWords, SiteSectionHeading } from '../site-parts'
import { SiteQuestionsList } from '../site-questions-list'
import { SiteTopBar } from '../site-top-bar'

/**
 * SITE-01 §12.14: what every public page beyond the landing shares -- the
 * bar over a Night header (breadcrumb, `h1`, subline, the "Updated" line and
 * the two actions), the page's sections, its questions with their
 * `FAQPage` JSON-LD, a compact closing band and the footer. Each page passes
 * only its content.
 */

export interface Crumb {
	label: string
	href: string
}

/** Per-language title, description and canonical address of a public page. */
export function sitePageMetadata({
	title,
	description,
	path,
}: {
	title: string
	description: string
	path: string
}): Metadata {
	return {
		title: { absolute: title },
		description,
		alternates: PUBLIC_ORIGIN ? { canonical: `${PUBLIC_ORIGIN}${path}` } : {},
		// Kept out of search until the site is launched, as the landing is.
		robots: siteLandingLive() ? undefined : { index: false, follow: false },
	}
}

/** "Updated November 2026", from a page's own `YYYY-MM` constant. */
export function updatedOn(locale: Locale, month: string) {
	const [year, monthIndex] = month.split('-').map(Number)
	return dateFormatter(locale, { month: 'long', year: 'numeric' }).format(
		new Date(Date.UTC(year, monthIndex - 1, 15)),
	)
}

function JsonLd({ data }: { data: unknown }) {
	return (
		<script
			type="application/ld+json"
			// The data is the page's own visible text, serialized.
			dangerouslySetInnerHTML={{
				__html: JSON.stringify(data).replace(/</g, '\\u003c'),
			}}
		/>
	)
}

export async function SitePageShell({
	crumbs,
	children,
}: {
	crumbs: Crumb[]
	children: ReactNode
}) {
	const t = await getTranslations('sitePages.shared.breadcrumb')
	const trail = [{ label: t('home'), href: '/' }, ...crumbs]
	return (
		<div className="site">
			<SiteTopBar />
			<main>{children}</main>
			<SiteClosingCompact />
			<SiteFooter />
			<SiteMotion />
			{PUBLIC_ORIGIN ? (
				<JsonLd
					data={{
						'@context': 'https://schema.org',
						'@type': 'BreadcrumbList',
						itemListElement: trail.map((crumb, index) => ({
							'@type': 'ListItem',
							position: index + 1,
							name: crumb.label,
							item: `${PUBLIC_ORIGIN}${crumb.href}`,
						})),
					}}
				/>
			) : null}
		</div>
	)
}

export async function SitePageHeader({
	crumbs,
	eyebrow,
	title,
	subline,
	updated,
	actions,
	facts,
	aside,
}: {
	crumbs: Crumb[]
	eyebrow?: ReactNode
	title: string
	subline: string
	updated?: string
	actions: { primary: Crumb; secondary?: Crumb }
	facts?: string[]
	aside?: ReactNode
}) {
	const t = await getTranslations('sitePages.shared')
	return (
		<header
			className="dark site-night site-page-header"
			data-region="night"
			data-has-aside={aside ? '' : undefined}
		>
			<div className="site-page-header-inner">
				<div id="content" className="site-page-header-text">
					<nav aria-label={t('breadcrumb.label')} className="site-breadcrumb">
						<ol>
							{crumbs.map((crumb, index) => (
								<li key={crumb.href}>
									{index > 0 ? (
										<ChevronRight className="size-3.5" aria-hidden />
									) : null}
									{index === crumbs.length - 1 ? (
										<span aria-current="page">{crumb.label}</span>
									) : (
										<Link href={crumb.href}>{crumb.label}</Link>
									)}
								</li>
							))}
						</ol>
					</nav>
					{eyebrow ? <p className="site-page-eyebrow">{eyebrow}</p> : null}
					<h1
						className="type-site-display site-page-title site-heading"
						data-reveal=""
					>
						<HeadingWords text={title} />
					</h1>
					<p className="type-site-lead site-lead site-page-subline">
						{subline}
					</p>
					{updated ? (
						<p className="site-page-updated">
							{t('updated', { date: updated })}
						</p>
					) : null}
					<div className="site-actions site-page-actions">
						{/* The bar's Get started waits for this one to scroll away, and
						    Sign in holds its place on a phone until then, as on the
						    landing (`data-hero-cta`). */}
						<Link
							href={actions.primary.href}
							data-hero-cta=""
							className="site-filled site-filled-hero site-filled-accent"
						>
							{actions.primary.label}
						</Link>
						{actions.secondary ? (
							<Link
								href={actions.secondary.href}
								className="site-ghost type-action"
							>
								<span>{actions.secondary.label}</span>
							</Link>
						) : null}
					</div>
					{facts?.length ? (
						<ul className="site-page-facts">
							{facts.map(fact => (
								<li key={fact}>{fact}</li>
							))}
						</ul>
					) : null}
				</div>
				{aside ? <div className="site-page-aside">{aside}</div> : null}
			</div>
		</header>
	)
}

/** A page section: its heading with the brand's rule, then its content. */
export function SitePageSection({
	id,
	heading,
	children,
	className,
}: {
	id: string
	heading: string
	children: ReactNode
	className?: string
}) {
	return (
		<section
			id={id}
			aria-labelledby={`${id}-heading`}
			className={cn('site-section site-page-section', className)}
		>
			<SiteSectionHeading id={`${id}-heading`}>{heading}</SiteSectionHeading>
			<div className="site-page-section-body" data-reveal="up">
				{children}
			</div>
		</section>
	)
}

/** The questions, as the landing's accordion, with their JSON-LD. */
export async function SitePageQuestions({
	items,
}: {
	items: { id: string; question: string; answer: ReactNode; plain: string }[]
}) {
	const t = await getTranslations('sitePages.shared')
	return (
		<section
			id="questions"
			aria-labelledby="questions-heading"
			className="site-section site-page-section"
		>
			<SiteSectionHeading id="questions-heading">
				{t('questions')}
			</SiteSectionHeading>
			<div className="site-page-questions">
				<SiteQuestionsList
					items={items.map(({ id, question, answer }) => ({
						id,
						question,
						answer,
					}))}
				/>
			</div>
			<JsonLd
				data={{
					'@context': 'https://schema.org',
					'@type': 'FAQPage',
					mainEntity: items.map(item => ({
						'@type': 'Question',
						name: item.question,
						acceptedAnswer: { '@type': 'Answer', text: item.plain },
					})),
				}}
			/>
		</section>
	)
}

/**
 * §12.14: the landing's closing heading and actions on the Night ground,
 * without its footage or the code to the phone.
 */
async function SiteClosingCompact() {
	const t = await getTranslations('site.closing')
	return (
		<section
			aria-labelledby="closing-heading"
			className="dark site-night site-closing-compact"
			data-region="night"
		>
			<div className="site-closing-compact-inner">
				<h2
					id="closing-heading"
					data-reveal=""
					className="type-site-heading site-heading"
				>
					<HeadingWords text={t('heading')} />
				</h2>
				<p className="type-site-lead site-lead">{t('subline')}</p>
				<div className="site-actions">
					<Link
						href="/signup"
						className="site-filled site-filled-hero site-filled-accent"
					>
						{t('createAccount')}
					</Link>
					<Link href="/login" className="site-ghost type-action">
						<span>{t('signIn')}</span>
					</Link>
				</div>
			</div>
		</section>
	)
}

/** Plain text for JSON-LD from a rich message: its tags dropped, text kept. */
export const plainTags = <K extends string>(keys: readonly K[]) =>
	Object.fromEntries(
		keys.map(key => [key, (chunks: string) => chunks]),
	) as Record<K, (chunks: string) => string>
