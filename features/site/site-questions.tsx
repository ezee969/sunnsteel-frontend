import { PRO_PRICE } from '@sunsteel/contracts'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import type { Locale } from '@/i18n/config'
import { SELLER } from '@/lib/legal/legal-facts'
import { LANDING_FACTS } from '@/lib/site/landing-examples'
import { formatPlanPrice } from '@/lib/utils/checkout'
import { CONSUMER_REQUEST_PATHS } from '@/lib/utils/consumer-requests'

import { SiteSectionHeading } from './site-parts'
import { SiteQuestionsList } from './site-questions-list'

/**
 * SITE-01 §12.11: what stops a visitor from signing up, answered honestly --
 * what the AI receives, what messages are, what is not medical advice. Every
 * number is contracts' and every fact the app's. The same messages make the
 * page's `FAQPage` JSON-LD, so the two can never differ.
 */
const QUESTIONS = [
	'free',
	'install',
	'offline',
	'beginners',
	'languages',
	'pro',
	'cancel',
	'privacy',
	'messages',
	'ai',
	'data',
	'medical',
] as const

export async function SiteQuestions() {
	const t = await getTranslations('site.questions')
	const locale = (await getLocale()) as Locale
	const values = {
		price: formatPlanPrice(PRO_PRICE, locale),
		days: LANDING_FACTS.trialDays,
		revocationDays: LANDING_FACTS.revocationDays,
		count: LANDING_FACTS.privacyParts,
		context: LANDING_FACTS.messageContext,
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
