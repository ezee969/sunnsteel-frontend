'use client'

import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'

import { cn } from '@/lib/utils'
import { type GlossaryTermId } from '@/lib/utils/glossary'

interface GlossaryLineProps {
	/** The terms this screen uses, in the order a member meets them. */
	terms: readonly GlossaryTermId[]
	className?: string
}

/**
 * UX-18 (design system §23.5): the terms a screen uses, each one a tap away
 * from its definition. A definition opens under the whole line rather than
 * inside the cell where the term appears, because those cells -- an RPE
 * field, a RIR column -- are too narrow to hold a sentence. One definition
 * shows at a time; tapping the open term again closes it. It opens on a tap
 * or the keyboard, never on hover, and pushes the content below it down.
 */
export function GlossaryLine({ terms, className }: GlossaryLineProps) {
	const t = useTranslations('core.glossary')
	const [open, setOpen] = useState<GlossaryTermId | null>(null)
	const definitionId = useId()

	return (
		<div className={cn('max-w-2xl', className)}>
			<p className="type-body-sm flex flex-wrap items-center gap-x-1 text-ink-3">
				<span>{t('label')}</span>
				{terms.map((term, index) => (
					<span key={term} className="inline-flex items-center">
						<button
							type="button"
							aria-expanded={open === term}
							aria-controls={definitionId}
							onClick={() =>
								setOpen(current => (current === term ? null : term))
							}
							className="inline-flex min-h-11 items-center rounded-sm px-1 text-ink-2 underline decoration-dotted underline-offset-4 outline-none transition-colors duration-[var(--motion-fast)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:min-h-0"
						>
							{t(`${term}.term`)}
						</button>
						{index < terms.length - 1 ? (
							<span aria-hidden className="text-ink-3">
								·
							</span>
						) : null}
					</span>
				))}
			</p>
			<p
				id={definitionId}
				role="note"
				hidden={open === null}
				className="type-body-sm mt-1 border-l border-rule pl-3 text-ink-3"
			>
				{open ? t(`${open}.definition`) : null}
			</p>
		</div>
	)
}
