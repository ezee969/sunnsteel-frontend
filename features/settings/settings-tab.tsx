'use client'

import { Loader2 } from 'lucide-react'
import { useRef } from 'react'

import { useScrollToHash } from '@/hooks/use-scroll-to-hash'
import { useUser } from '@/lib/api/hooks/useUser'

/**
 * One Settings tab's content (UX-12). Its cards mount only once the profile
 * has loaded, as the single page did, so a card that reads the account's unit
 * or settings on mount never starts from a placeholder. It then lands a
 * `#card` link on its target (TD-55), which each tab does itself because the
 * layout stays mounted (design system §21.4).
 */
export function SettingsTab({ children }: { children: React.ReactNode }) {
	const { user, isLoading } = useUser()
	const contentRef = useRef<HTMLDivElement>(null)
	useScrollToHash(contentRef, !isLoading && Boolean(user))

	if (isLoading) {
		return (
			<div className="flex justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin text-ink-3" />
			</div>
		)
	}

	return (
		<div ref={contentRef} className="space-y-8">
			{children}
		</div>
	)
}
