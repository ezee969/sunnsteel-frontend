'use client'

import { useCallback, useSyncExternalStore } from 'react'

import {
	CONTRAST_ATTRIBUTE,
	CONTRAST_PREFERENCE_STORAGE_KEY,
	type ContrastPreference,
	CONTROL_SIZE_ATTRIBUTE,
	CONTROL_SIZE_STORAGE_KEY,
	type ControlSizePreference,
	DISPLAY_PREFERENCE_EVENT,
	parseContrastPreference,
	parseControlSizePreference,
	resolveHigherContrast,
} from '@/lib/utils/display-preference'

const MORE_CONTRAST_QUERY = '(prefers-contrast: more)'

function readStored(key: string): string | null {
	try {
		return window.localStorage.getItem(key)
	} catch {
		return null
	}
}

function subscribe(onChange: () => void) {
	const media = window.matchMedia?.(MORE_CONTRAST_QUERY)
	media?.addEventListener('change', onChange)
	window.addEventListener('storage', onChange)
	window.addEventListener(DISPLAY_PREFERENCE_EVENT, onChange)
	return () => {
		media?.removeEventListener('change', onChange)
		window.removeEventListener('storage', onChange)
		window.removeEventListener(DISPLAY_PREFERENCE_EVENT, onChange)
	}
}

/** Stores or clears one choice, then applies it to <html> for this page view. */
function apply(key: string, attribute: string, value: string | null) {
	try {
		if (value) window.localStorage.setItem(key, value)
		else window.localStorage.removeItem(key)
	} catch {
		// Storage can be unavailable (private mode, blocked site data); the
		// attribute below still applies the choice until the page reloads.
	}
	if (value) document.documentElement.setAttribute(attribute, value)
	else document.documentElement.removeAttribute(attribute)
	window.dispatchEvent(new Event(DISPLAY_PREFERENCE_EVENT))
}

/**
 * The device's display preferences (A11Y-02). CSS already follows both
 * through the `data-contrast`/`data-controls` attributes and the media query;
 * this hook is for the controls that change them and for components whose
 * structure differs under larger controls (LIVE-18's grouped menus).
 */
export function useDisplayPreference() {
	const contrast = useSyncExternalStore(
		subscribe,
		() => parseContrastPreference(readStored(CONTRAST_PREFERENCE_STORAGE_KEY)),
		() => 'system' as const,
	)
	const systemMoreContrast = useSyncExternalStore(
		subscribe,
		() => window.matchMedia?.(MORE_CONTRAST_QUERY).matches ?? false,
		() => false,
	)
	const controlSize = useSyncExternalStore(
		subscribe,
		() => parseControlSizePreference(readStored(CONTROL_SIZE_STORAGE_KEY)),
		() => 'standard' as const,
	)

	const setContrast = useCallback((next: ContrastPreference) => {
		apply(
			CONTRAST_PREFERENCE_STORAGE_KEY,
			CONTRAST_ATTRIBUTE,
			next === 'more' ? 'more' : null,
		)
	}, [])
	const setControlSize = useCallback((next: ControlSizePreference) => {
		apply(
			CONTROL_SIZE_STORAGE_KEY,
			CONTROL_SIZE_ATTRIBUTE,
			next === 'large' ? 'large' : null,
		)
	}, [])

	return {
		contrast,
		systemMoreContrast,
		higherContrast: resolveHigherContrast(contrast, systemMoreContrast),
		controlSize,
		largeControls: controlSize === 'large',
		setContrast,
		setControlSize,
	}
}
