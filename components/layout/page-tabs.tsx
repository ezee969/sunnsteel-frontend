'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useId, useRef } from 'react'

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
	bleedClassName = '-mx-3 px-3 sm:-mx-6 sm:px-6',
	className,
}: PageTabsProps) {
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

	return (
		<nav
			aria-label={label}
			className={cn(
				'border-b border-rule bg-background',
				sticky && 'sticky -top-3 z-20 sm:-top-6',
				bleedClassName,
				className,
			)}
		>
			<div className="py-2 sm:hidden">
				<label htmlFor={selectId} className="sr-only">
					Section
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
			<ul className="hidden gap-1 sm:flex">
				{tabs.map(tab => {
					const isCurrent = tab.href === current
					return (
						<li key={tab.href}>
							<Link
								href={tab.href}
								scroll={false}
								aria-current={isCurrent ? 'page' : undefined}
								className={cn(
									'type-button -mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-3 outline-none transition-colors duration-[var(--motion-fast)] ease-standard focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:min-h-10',
									isCurrent
										? 'border-foreground text-foreground'
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
