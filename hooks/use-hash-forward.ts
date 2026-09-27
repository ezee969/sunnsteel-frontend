'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useLayoutEffect, useState } from 'react'

import { type HashRule, tabForHash } from '@/lib/utils/page-tabs'

/**
 * Design system §21: an old `#id` link to a page that is now split into
 * tabs lands on the tab that holds the element. Call it on the tab an old
 * link opens (the bare route); while it forwards, render nothing, so the
 * wrong tab never flashes. The receiving tab lands on the element through
 * `useScrollToHash` (TD-55).
 */
export function useHashForward(rules: readonly HashRule[]): boolean {
	const router = useRouter()
	const pathname = usePathname()
	const [forwarding, setForwarding] = useState(false)

	useLayoutEffect(() => {
		const target = tabForHash(window.location.hash, rules)
		if (!target || target === pathname) return
		setForwarding(true)
		router.replace(`${target}${window.location.hash}`, { scroll: false })
		// The rules are page constants; read them once, on arrival.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return forwarding
}
