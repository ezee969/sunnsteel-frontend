'use client'

import { RefreshCw, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type InlineErrorProps = {
	/** What could not be done, in the feature's own words. */
	title: ReactNode
	/** Why, or what to do: usually `useApiErrorMessage()(error)`. */
	message?: ReactNode
	/** Shows an outline Try again; omit when retrying cannot help. */
	onRetry?: () => void
	retrying?: boolean
	className?: string
}

/**
 * UX-24 (audit 2026-10, DS8): the one way a section says a read failed, where
 * features had grown a boxed panel, a red-bordered box and bare red text, half
 * of them without a way to retry. A failed read is a risk to the member's
 * task, not a destruction, so it takes the warning mark and triangle (§4.3
 * rules 4 and 8) with the copy in ink, never crimson text. The retry is
 * outline: the region's one filled action stays where it was (§4.3 rule 1).
 * A whole route that fails uses `RouteError` instead.
 */
export function InlineError({
	title,
	message,
	onRetry,
	retrying = false,
	className,
}: InlineErrorProps) {
	const t = useTranslations('core.common')
	return (
		<div
			role="alert"
			className={cn(
				'mark mark-warning max-w-[68ch] bg-surface-sunk py-3 pl-3 pr-3',
				className,
			)}
		>
			<div className="flex items-start gap-2">
				<TriangleAlert
					aria-hidden
					className="mt-0.5 size-4 shrink-0 text-warning-strong"
				/>
				<div className="min-w-0 space-y-1">
					<p className="type-panel text-foreground">{title}</p>
					{message ? (
						<p className="type-body-sm break-words text-ink-2">{message}</p>
					) : null}
				</div>
			</div>
			{onRetry ? (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="mt-3"
					onClick={onRetry}
					disabled={retrying}
				>
					<RefreshCw
						aria-hidden
						className={cn('size-4', retrying && 'animate-spin')}
					/>
					{t('tryAgain')}
				</Button>
			) : null}
		</div>
	)
}
