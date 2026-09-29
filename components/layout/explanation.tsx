'use client'

import { ChevronDown, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ExplanationProps {
	/** The one line that is always shown. */
	summary: React.ReactNode
	/** The full rules, shown only when asked for. */
	children: React.ReactNode
	label?: string
	className?: string
}

/**
 * Design system §20.3: a page's rules stated in one line, with the rest one
 * tap away. It opens on a tap or the keyboard, never on hover alone (touch
 * has no hover), and it pushes the content below it down instead of
 * floating over it. It starts closed on every visit.
 */
export function Explanation({
	summary,
	children,
	label,
	className,
}: ExplanationProps) {
	const t = useTranslations('core.common')
	const resolvedLabel = label ?? t('howThisWorks')
	const [open, setOpen] = useState(false)
	const bodyId = useId()

	return (
		<div className={cn('max-w-2xl', className)}>
			<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
				<p className="type-body-sm text-ink-3">{summary}</p>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					aria-expanded={open}
					aria-controls={bodyId}
					onClick={() => setOpen(current => !current)}
					className="-ml-3 h-11 sm:ml-0 sm:h-9"
				>
					<Info aria-hidden />
					{resolvedLabel}
					<ChevronDown aria-hidden className={cn(open && 'rotate-180')} />
				</Button>
			</div>
			<div
				id={bodyId}
				hidden={!open}
				className="type-body-sm mt-2 space-y-2 border-l border-rule pl-3 text-ink-3"
			>
				{children}
			</div>
		</div>
	)
}
