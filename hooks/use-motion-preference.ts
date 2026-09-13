'use client'

import { useCallback, useSyncExternalStore } from 'react'

import {
	MOTION_ATTRIBUTE,
	MOTION_PREFERENCE_EVENT,
	MOTION_PREFERENCE_STORAGE_KEY,
	type MotionPreference,
	parseMotionPreference,
	resolveReducedMotion,
} from '@/lib/utils/motion-preference'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function readStoredPreference(): MotionPreference {
	try {
		return parseMotionPreference(
			window.localStorage.getItem(MOTION_PREFERENCE_STORAGE_KEY),
		)
	} catch {
		return 'system'
	}
}

function readSystemPreference(): boolean {
	return window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false
}

function subscribe(onChange: () => void) {
	const media = window.matchMedia?.(REDUCED_MOTION_QUERY)
	media?.addEventListener('change', onChange)
	window.addEventListener('storage', onChange)
	window.addEventListener(MOTION_PREFERENCE_EVENT, onChange)
	return () => {
		media?.removeEventListener('change', onChange)
		window.removeEventListener('storage', onChange)
		window.removeEventListener(MOTION_PREFERENCE_EVENT, onChange)
	}
}

/**
 * The device's motion preference (A11Y-01) combined with the OS setting.
 * Use `reduced` to decide *how* something moves, never *whether* information
 * is shown (motion spec §3). CSS already follows both through the media query
 * and the `data-motion` attribute; this hook is for framer-motion values that
 * CSS cannot reach.
 */
export function useMotionPreference() {
	const preference = useSyncExternalStore(
		subscribe,
		readStoredPreference,
		() => 'system' as const,
	)
	const systemReduced = useSyncExternalStore(
		subscribe,
		readSystemPreference,
		() => false,
	)

	const setPreference = useCallback((next: MotionPreference) => {
		try {
			if (next === 'reduce') {
				window.localStorage.setItem(MOTION_PREFERENCE_STORAGE_KEY, 'reduce')
			} else {
				window.localStorage.removeItem(MOTION_PREFERENCE_STORAGE_KEY)
			}
		} catch {
			// Storage can be unavailable (private mode, blocked site data). The
			// attribute below still applies the choice for this page view.
		}
		if (next === 'reduce') {
			document.documentElement.setAttribute(MOTION_ATTRIBUTE, 'reduce')
		} else {
			document.documentElement.removeAttribute(MOTION_ATTRIBUTE)
		}
		window.dispatchEvent(new Event(MOTION_PREFERENCE_EVENT))
	}, [])

	return {
		preference,
		systemReduced,
		reduced: resolveReducedMotion(preference, systemReduced),
		setPreference,
	}
}
