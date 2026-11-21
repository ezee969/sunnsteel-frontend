import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * SITE-01 §33: the parts every landing section shares -- the section heading
 * in the site's heading rank with the brand's rule under it, the original
 * phone frame of §33.8 with its "Example" mark, and the plan tag (a word,
 * never a colour: §33.4).
 */
export function SiteSectionHeading({
	id,
	children,
	className,
}: {
	id: string
	children: ReactNode
	className?: string
}) {
	return (
		<h2 id={id} className={cn('type-site-heading site-heading', className)}>
			{children}
		</h2>
	)
}

export function ExampleMark({ label }: { label: string }) {
	return <span className="type-label site-example">{label}</span>
}

/** An original frame drawn to the brand's line, never a manufacturer's. */
export function SitePhoneFrame({
	example,
	children,
	className,
}: {
	example: string
	children: ReactNode
	className?: string
}) {
	return (
		<div aria-hidden="true" className={cn('site-device', className)}>
			<div className="site-device-bar">
				<ExampleMark label={example} />
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
}: {
	children: ReactNode
	className?: string
	as?: 'div' | 'article' | 'section' | 'li'
}) {
	return <Tag className={cn('site-card', className)}>{children}</Tag>
}
