'use client'

import { useRef } from 'react'

import { useScrollToHash } from '@/hooks/use-scroll-to-hash'

/**
 * One Progress tab's content (UX-11). It lands a `#section` link on its
 * target through `useScrollToHash`, which each tab calls itself because the
 * layout stays mounted (design system §21.4), and gives every anchor room
 * below the pinned tab bar.
 */
export function ProgressTab({ children }: { children: React.ReactNode }) {
	const contentRef = useRef<HTMLDivElement>(null)
	useScrollToHash(contentRef, true)
	return (
		<div
			ref={contentRef}
			className="flex flex-col gap-6 sm:gap-8 [&_[id]]:scroll-mt-24"
		>
			{children}
		</div>
	)
}
