import { useEffect, useState } from 'react'

export type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

interface Entry {
	state: SaveState
	updatedAt: number
	message?: string
}

const store = new Map<string, Entry>()
const listeners = new Set<() => void>()

function emit() {
	listeners.forEach(l => l())
}

export function setSaveState(key: string, state: SaveState, message?: string) {
	store.set(key, { state, updatedAt: Date.now(), message })
	emit()
	scheduleAutoIdle(key)
}

export function getSaveState(key: string): Entry | undefined {
	return store.get(key)
}

// Auto-transition from 'saved' back to 'idle' after a short dwell to keep UI calm
const SAVED_DWELL_MS = 2000
const timers = new Map<string, number>()

function scheduleAutoIdle(key: string) {
	// Clear any pending timer for this key
	const existing = timers.get(key)
	if (existing) {
		clearTimeout(existing)
		timers.delete(key)
	}

	const entry = store.get(key)
	if (!entry || entry.state !== 'saved') return

	const remain = Math.max(0, SAVED_DWELL_MS - (Date.now() - entry.updatedAt))
	const tid = window.setTimeout(() => {
		const current = store.get(key)
		if (
			current &&
			current.state === 'saved' &&
			Date.now() - current.updatedAt >= SAVED_DWELL_MS
		) {
			store.set(key, { state: 'idle', updatedAt: Date.now() })
			emit()
		}
		timers.delete(key)
	}, remain)
	timers.set(key, tid)
}
// Public hook for components
export function useSaveState(key: string) {
	const [entry, setEntry] = useState<Entry | undefined>(() => getSaveState(key))
	useEffect(() => {
		const listener = () => {
			setEntry(getSaveState(key))
		}
		listeners.add(listener)
		return () => {
			listeners.delete(listener)
		}
	}, [key])

	return entry?.state ?? 'idle'
}

// Convenience label helper
export function saveStateLabel(state: SaveState) {
	switch (state) {
		case 'pending':
			return 'Unsaved'
		case 'saving':
			return 'Saving…'
		case 'saved':
			return 'Saved'
		case 'error':
			return 'Error'
		default:
			return ''
	}
}
