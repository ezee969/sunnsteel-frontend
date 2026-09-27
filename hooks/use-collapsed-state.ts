'use client'

import { useCallback, useSyncExternalStore } from 'react'

import {
	COLLAPSE_CHANGE_EVENT,
	collapseStorageKey,
	type DefaultOpen,
	parseStoredOpen,
	resolveOpen,
	serializeOpen,
	WIDE_QUERY,
} from '@/lib/utils/long-content'

/** Choices made in this tab when storage refuses them. */
const unstored = new Map<string, boolean>()

function readStored(key: string): boolean | null {
	try {
		// A write can fail where a read works (a full quota), so fall back.
		return (
			parseStoredOpen(window.localStorage.getItem(key)) ??
			unstored.get(key) ??
			null
		)
	} catch {
		return unstored.get(key) ?? null
	}
}

function subscribe(onChange: () => void) {
	const media = window.matchMedia?.(WIDE_QUERY)
	media?.addEventListener('change', onChange)
	window.addEventListener('storage', onChange)
	window.addEventListener(COLLAPSE_CHANGE_EVENT, onChange)
	return () => {
		media?.removeEventListener('change', onChange)
		window.removeEventListener('storage', onChange)
		window.removeEventListener(COLLAPSE_CHANGE_EVENT, onChange)
	}
}

/**
 * A section's open state, remembered per device (UX-01). Nothing is stored
 * until the member toggles it, so a `'wide'` default keeps following the
 * window until then. Storage that throws (a private window, blocked site
 * data) only means the choice is not remembered.
 */
export function useCollapsedState(
	id: string,
	defaultOpen: DefaultOpen,
): [boolean, (open: boolean) => void] {
	const key = collapseStorageKey(id)
	const open = useSyncExternalStore(
		subscribe,
		() =>
			resolveOpen(
				readStored(key),
				defaultOpen,
				window.matchMedia?.(WIDE_QUERY).matches ?? true,
			),
		() => defaultOpen !== false,
	)

	const setOpen = useCallback(
		(next: boolean) => {
			try {
				window.localStorage.setItem(key, serializeOpen(next))
			} catch {
				// Not remembered past this tab, but it still opens or closes.
				unstored.set(key, next)
			}
			window.dispatchEvent(new Event(COLLAPSE_CHANGE_EVENT))
		},
		[key],
	)

	return [open, setOpen]
}
