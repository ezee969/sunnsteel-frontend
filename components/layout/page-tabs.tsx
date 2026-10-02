'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

import { NativeSelect } from '@/components/ui/native-select'
import { cn } from '@/lib/utils'
import { activeTabHref, type PageTab } from '@/lib/utils/page-tabs'

interface PageTabsProps {
	/** Names the nav, e.g. "Progress sections". */
	label: string
	tabs: readonly PageTab[]
	/**
	 * Pinned at the top of `<main>` (design system §21, as §20.2's controls).
	 * Its negative top cancels `<main>`'s padding, which a sticky offset is
	 * measured inside; `bleedClassName` cancels the page's own side padding.
	 */
	sticky?: boolean
	bleedClassName?: string
	className?: string
}

function scrollMainToTop() {
	document.querySelector('main')?.scrollTo({ top: 0 })
}

/**
 * Design system §21: a page's route tabs. Navigation, not an ARIA tablist,
 * because every tab is a URL and Back must work: a `nav` of links with
 * `aria-current="page"`. Below `sm` the row becomes one select, so no tab is
 * ever hidden off-screen (§20.2). Changing tab keeps the pinned bar and goes
 * back to the top of the page.
 */
export function PageTabs({
	label,
	tabs,
	sticky = true,
	bleedClassName = 'shell-bleed',
	className,
}: PageTabsProps) {
	const t = useTranslations('core.common')
	const pathname = usePathname()
	const search = useSearchParams()
	const router = useRouter()
	const selectId = useId()
	const current = activeTabHref(tabs, pathname, search)

	// Back to the top after a tab change, not on the first render: a deep
	// link to `#…` must keep the position `useScrollToHash` gives it.
	const previous = useRef(current)
	useEffect(() => {
		if (previous.current !== current) scrollMainToTop()
		previous.current = current
	}, [current])

	// v1.1 §26.6 / motion §8: the current tab's underline is one element that
	// slides to the new tab when the route changes (the bar does not remount,
	// §21.1). Until it has been measured -- the first paint, or the select
	// width below `sm` -- the current link draws its own underline, so the
	// mark is there from the first frame and never fades in.
	const listRef = useRef<HTMLUListElement>(null)
	const [marker, setMarker] = useState<{ x: number; w: number } | null>(null)
	useLayoutEffect(() => {
		const list = listRef.current
		if (!list) return
		const measure = () => {
			const link = list.querySelector<HTMLElement>('[aria-current="page"]')
			setMarker(
				link && link.offsetWidth > 0
					? { x: link.offsetLeft, w: link.offsetWidth }
					: null,
			)
		}
		measure()
		const observer = new ResizeObserver(measure)
		observer.observe(list)
		return () => observer.disconnect()
	}, [current])

	return (
		<nav
			aria-label={label}
			className={cn(
				'border-b border-rule bg-background',
				sticky && 'shell-pin z-20',
				bleedClassName,
				className,
			)}
		>
			<div className="py-2 sm:hidden">
				<label htmlFor={selectId} className="sr-only">
					{t('section')}
				</label>
				<NativeSelect
					id={selectId}
					value={current ?? ''}
					onChange={event => router.push(event.target.value, { scroll: false })}
				>
					{tabs.map(tab => (
						<option key={tab.href} value={tab.href}>
							{tab.count === undefined
								? tab.label
								: `${tab.label} (${tab.count})`}
						</option>
					))}
				</NativeSelect>
			</div>
			{/* Between md and lg the sidebar leaves 512-768px, where Settings'
			    five Spanish tabs ran 8px wide: the tabs narrow there. */}
			<ul ref={listRef} className="relative hidden gap-1 sm:flex">
				{marker ? (
					<li
						aria-hidden
						className="pointer-events-none absolute bottom-[-1px] left-0 h-0.5 w-px origin-left bg-foreground transition-transform duration-[var(--motion-base)] ease-standard"
						style={{
							transform: `translateX(${marker.x}px) scaleX(${marker.w})`,
						}}
					/>
				) : null}
				{tabs.map(tab => {
					const isCurrent = tab.href === current
					return (
						<li key={tab.href}>
							<Link
								href={tab.href}
								scroll={false}
								aria-current={isCurrent ? 'page' : undefined}
								className={cn(
									'type-button -mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-3 outline-none transition-colors duration-[var(--motion-fast)] ease-standard focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:min-h-10 md:max-lg:px-2.5',
									isCurrent
										? cn(
												'text-foreground',
												marker ? 'border-transparent' : 'border-foreground',
											)
										: 'border-transparent text-ink-2 hover:text-foreground',
								)}
							>
								{tab.label}
								{tab.count === undefined ? null : (
									<span className="type-data">{tab.count}</span>
								)}
							</Link>
						</li>
					)
				})}
			</ul>
		</nav>
	)
}
