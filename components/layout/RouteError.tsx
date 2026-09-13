import type { ReactNode } from 'react'

import HeroSection from './HeroSection'

interface RouteErrorProps {
	title: ReactNode
	description?: ReactNode
	/** The raw error text, shown as data in a well rather than as prose. */
	message?: string
	/** The actions: one filled retry, the rest outline (§11.4). */
	children: ReactNode
}

/**
 * The one composition every error and not-found boundary shares (TD-38): the
 * page masthead over the double rule (§11.11), the error text in a `sunk` well,
 * and the actions on the same left axis (§11.9). The boundaries were centred
 * stacks with no masthead, and each one drew its own. Callers outside the
 * protected shell supply the page grid; inside it, `<main>` already does.
 */
export function RouteError({
	title,
	description,
	message,
	children,
}: RouteErrorProps) {
	return (
		<div className="flex flex-col gap-6">
			<HeroSection title={title} subtitle={description} />
			{message ? (
				<p className="type-data max-w-[68ch] break-words bg-surface-sunk p-3 text-ink-2">
					{message}
				</p>
			) : null}
			<div className="flex flex-wrap gap-3">{children}</div>
		</div>
	)
}
