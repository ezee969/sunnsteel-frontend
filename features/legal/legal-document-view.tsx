'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import { inlineSegments, legalDocument } from '@/lib/legal/documents'
import {
	LEGAL_UPDATED,
	type LegalBlock,
	type LegalDocument,
	type LegalDocumentId,
} from '@/lib/legal/legal-facts'

function Inline({ text }: { text: string }) {
	return (
		<>
			{inlineSegments(text).map((segment, index) =>
				segment.kind === 'link' ? (
					<Link
						key={index}
						href={segment.href}
						className="underline underline-offset-4 hover:text-foreground"
					>
						{segment.text}
					</Link>
				) : (
					<span key={index}>{segment.text}</span>
				),
			)}
		</>
	)
}

function Block({ block }: { block: LegalBlock }) {
	if (typeof block === 'string') {
		return (
			<p className="type-body max-w-[68ch]">
				<Inline text={block} />
			</p>
		)
	}
	return (
		<ul className="type-body max-w-[68ch] list-disc space-y-1 pl-6">
			{block.list.map(item => (
				<li key={item}>
					<Inline text={item} />
				</li>
			))}
		</ul>
	)
}

function Sections({ doc }: { doc: LegalDocument }) {
	return (
		<div className="flex flex-col gap-6">
			{doc.sections.map(section => (
				<section key={section.heading} className="flex flex-col gap-2">
					<h2 className="type-section">{section.heading}</h2>
					{section.blocks.map((block, index) => (
						<Block key={index} block={block} />
					))}
				</section>
			))}
		</div>
	)
}

/**
 * BILL-07: one legal text in the app's language. Spanish governs (the
 * owner's decision), so the English page says it is a translation and keeps
 * the Spanish text one click away on the same page.
 */
export function LegalDocumentView({ id }: { id: LegalDocumentId }) {
	const t = useTranslations('core.legalPage')
	const locale = useLocale() as Locale
	const doc = legalDocument(id, locale)
	const updated = dateFormatter(locale, { dateStyle: 'long' }).format(
		new Date(`${LEGAL_UPDATED}T12:00:00`),
	)

	return (
		<article className="mx-auto flex w-full max-w-3xl flex-col gap-8">
			<header className="flex flex-col gap-2">
				<h1 className="type-page">{doc.title}</h1>
				<p className="type-body-sm text-ink-3">
					{t('updated', { date: updated })}
				</p>
				{locale !== 'es' ? (
					<p className="type-body-sm text-ink-2 max-w-[68ch]">
						{t('translationNotice')}
					</p>
				) : null}
			</header>
			<Sections doc={doc} />
			{locale !== 'es' ? (
				<Accordion type="single" collapsible>
					<AccordionItem value="es">
						<AccordionTrigger>{t('spanishVersion')}</AccordionTrigger>
						<AccordionContent>
							<div lang="es" className="pt-2">
								<Sections doc={legalDocument(id, 'es')} />
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			) : null}
		</article>
	)
}
