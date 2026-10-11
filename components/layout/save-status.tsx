'use client'

import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'

interface SaveStatusProps {
	/** A save is on its way. */
	pending: boolean
	/** The last save went through. */
	saved: boolean
	className?: string
}

/**
 * UX-26 (design system §28.7): what a Settings card that saves on change
 * says about it -- "Saving…" while the write runs, then "Saved" with a
 * check -- in one polite status line, so a choice that took effect is not
 * silent. A failed save still raises its toast and puts the choice back.
 * Deliberately no `aria-label`: it reports something, it is not loading.
 */
export function SaveStatus({ pending, saved, className }: SaveStatusProps) {
	const t = useTranslations('core.saveStatus')
	return (
		<p
			role="status"
			className={cn(
				'type-body-sm flex min-h-5 items-center gap-1.5 text-ink-3',
				className,
			)}
		>
			{pending ? (
				t('saving')
			) : saved ? (
				<>
					<Check className="size-4" aria-hidden />
					{t('saved')}
				</>
			) : null}
		</p>
	)
}
