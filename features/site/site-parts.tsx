import { type CSSProperties, Fragment, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * SITE-01 §33: the parts every landing section shares -- the section heading
 * in the site's heading rank with the brand's rule under it, the original
 * phone frame of §33.8, and the plan tag (a word, never a colour: §33.4).
 */
export function SiteSectionHeading({
	id,
	children,
	className,
}: {
	id: string
	children: string
	className?: string
}) {
	return (
		<h2
			id={id}
			data-reveal=""
			className={cn('type-site-heading site-heading', className)}
		>
			<HeadingWords text={children} />
		</h2>
	)
}

/**
 * A heading's words, each behind its own mask so its line can rise into
 * place (§33.9); the motion runtime numbers them by line. Read as one string.
 */
export function HeadingWords({ text }: { text: string }) {
	const words = text.split(' ')
	return words.map((word, index) => (
		<Fragment key={index}>
			<span className="site-w">
				<span>{word}</span>
			</span>
			{index < words.length - 1 ? ' ' : null}
		</Fragment>
	))
}

/** An original frame drawn to the brand's line, never a manufacturer's. */
/**
 * The status bar's clock. A phone carries no "Example" mark any more (the
 * owner, 2026-11-22, and on every mock-up the next day); the hero phone's
 * accessible name says it is an example, every other mock-up is aria-hidden.
 */
export const PHONE_CLOCK = '7:05'

export function SitePhoneFrame({
	children,
	className,
}: {
	children: ReactNode
	className?: string
}) {
	return (
		// Night in both themes (the owner, 2026-11-22): dark devices stand out
		// of the page's ground instead of melting into it.
		<div aria-hidden="true" className={cn('dark site-device', className)}>
			<div className="site-device-bar">
				<span className="site-device-clock">{PHONE_CLOCK}</span>
				<span className="site-device-status">
					<span className="flex gap-0.5">
						{[0, 1, 2].map(dot => (
							<span key={dot} className="size-[3px] rounded-full bg-ink-3" />
						))}
					</span>
					<span className="h-[7px] w-[5px] bg-ink-3" />
				</span>
			</div>
			<div className="site-device-screen">{children}</div>
		</div>
	)
}

export function PlanTag({ children }: { children: ReactNode }) {
	return <span className="type-label site-tag">{children}</span>
}

/** A ruled card on the surface, the small radius and no shadow (§33.5). */
export function SiteCard({
	children,
	className,
	as: Tag = 'div',
	...rest
}: {
	children: ReactNode
	className?: string
	as?: 'div' | 'article' | 'section' | 'li'
	style?: CSSProperties
	'data-play-when'?: string
	'data-play-media'?: string
	'data-reveal'?: string
}) {
	return (
		<Tag className={cn('site-card', className)} {...rest}>
			{children}
		</Tag>
	)
}

/** Custom properties for a script's timing (`--i`, `--dir`, `--seq`...). */
export const motionVars = (values: Record<string, string | number>) =>
	values as CSSProperties
