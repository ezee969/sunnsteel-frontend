'use client'

import { useLocale } from 'next-intl'
import { useEffect } from 'react'

import { readLocaleCookie, writeLocaleCookie } from '@/i18n/locale-cookie'
import { useUser } from '@/lib/api/hooks/useUser'

const ATTEMPT_KEY = 'ss-locale-sync'

/**
 * I18N-02: a device signing in to an account that chose a language adopts
 * it. The account wins over whatever this browser had; an account that chose
 * nothing leaves the device alone. It reloads at most once per target per
 * tab, so a browser that refuses the cookie never loops.
 */
export function LocaleSync() {
	const locale = useLocale()
	const { user } = useUser()
	const stored = user?.locale ?? null

	useEffect(() => {
		if (!stored || stored === locale) return
		if (readLocaleCookie() === stored) return
		try {
			if (sessionStorage.getItem(ATTEMPT_KEY) === stored) return
			sessionStorage.setItem(ATTEMPT_KEY, stored)
		} catch {
			return
		}
		writeLocaleCookie(stored)
		window.location.reload()
	}, [stored, locale])

	return null
}
