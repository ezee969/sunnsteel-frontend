'use client'

import { useSyncExternalStore } from 'react'

import { useDisplayPreference } from '@/hooks/use-display-preference'

/** Below Tailwind's `sm`, where the workout screen has a phone's width. */
export const COMPACT_WORKOUT_QUERY = '(max-width: 639.98px)'

function readPhoneWidth(): boolean {
	return window.matchMedia?.(COMPACT_WORKOUT_QUERY).matches ?? false
}

function subscribe(onChange: () => void) {
	const media = window.matchMedia?.(COMPACT_WORKOUT_QUERY)
	media?.addEventListener('change', onChange)
	return () => media?.removeEventListener('change', onChange)
}

/**
 * UX-21 (design system §23.7): whether the workout screen groups its less-used
 * actions -- one menu per exercise, one per set -- the way gym mode does. A
 * phone always does, whatever the larger-controls setting; larger controls
 * does at every width. Sizes stay larger controls' alone: they come from the
 * `large-controls:` variant, never from this.
 */
export function useCompactWorkout(): boolean {
	const { largeControls } = useDisplayPreference()
	const phone = useSyncExternalStore(subscribe, readPhoneWidth, () => false)
	return largeControls || phone
}
