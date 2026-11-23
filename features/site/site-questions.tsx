import { PRO_PRICE } from '@sunsteel/contracts'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import type { Locale } from '@/i18n/config'
import { SELLER } from '@/lib/legal/legal-facts'
import { LANDING_FACTS } from '@/lib/site/landing-examples'
import { formatPlanPrice } from '@/lib/utils/checkout'
import { CONSUMER_REQUEST_PATHS } from '@/lib/utils/consumer-requests'
import { formatWeight } from '@/lib/utils/weight-unit'

import { SiteSectionHeading } from './site-parts'
import { SiteQuestionsList } from './site-questions-list'

/**
 * SITE-01 §12.11: what a first-time visitor asks before signing up, answered
 * honestly (the owner, 2026-11-23: no basics such as the languages, nothing
 * on medical advice) -- what it costs, how it installs, what it does for the
 * next workout, what the AI receives. Every number is contracts' and every
 * fact the app's. The same messages make the page's `FAQPage` JSON-LD, so the
 * two can never differ.
 */
const QUESTIONS = [
	'free',
	'install',
	'beginners',
	'progression',
	'customExercises',
	'offline',
	'pro',
	'cancel',
	'privacy',
	'ai',
	'data',
] as const

export async function SiteQuestions() {
	const t = await getTranslations('site.questions')
	const locale = (await getLocale()) as Locale
	const values = {
		price: formatPlanPrice(PRO_PRICE, locale),
		days: LANDING_FACTS.trialDays,
		revocationDays: LANDING_FACTS.revocationDays,
		count: LANDING_FACTS.privacyParts,
		step: formatWeight(LANDING_FACTS.step, 'KG', locale),
		customMax: LANDING_FACTS.customExercisesMax,
	}
	const link = (href: string) => {
		const InlineLink = (chunks: ReactNode) => (
			<Link href={href} className="site-inline-link">
				{chunks}
			</Link>
		)
		return InlineLink
	}
	const tags = {
		link: link('/pricing'),
		cancellation: link(CONSUMER_REQUEST_PATHS.CANCELLATION),
		revocation: link(CONSUMER_REQUEST_PATHS.REVOCATION),
	}
	const plain = {
		link: (chunks: string) => chunks,
		cancellation: (chunks: string) => chunks,
		revocation: (chunks: string) => chunks,
	}

	const items = QUESTIONS.map(id => ({
		id,
		question: t(`items.${id}.question`),
		answer: t.rich(`items.${id}.answer`, { ...values, ...tags }),
	}))
	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: QUESTIONS.map(id => ({
			'@type': 'Question',
			name: t(`items.${id}.question`),
			acceptedAnswer: {
				'@type': 'Answer',
				text: t.markup(`items.${id}.answer`, { ...values, ...plain }),
			},
		})),
	}

	return (
		<section
			aria-labelledby="questions-heading"
			className="site-section"
			id="questions"
		>
			<script
				type="application/ld+json"
				// The messages are ours, and `<` is escaped so no answer can close
				// the script element.
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
				}}
			/>
			<div className="site-questions">
				<div className="site-questions-head">
					<SiteSectionHeading id="questions-heading">
						{t('heading')}
					</SiteSectionHeading>
					<p className="type-body site-body">
						{t.rich('contact', {
							email: SELLER.email,
							mail: chunks => (
								<a href={`mailto:${SELLER.email}`} className="site-inline-link">
									{chunks}
								</a>
							),
						})}
					</p>
				</div>
				<SiteQuestionsList items={items} />
			</div>
		</section>
	)
}
