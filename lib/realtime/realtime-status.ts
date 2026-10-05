import { useSyncExternalStore } from 'react'

/**
 * MSG-06: whether this tab's realtime stream is delivering changes. Reads
 * that otherwise poll ask it, so they poll only while it is not. It starts
 * false, so a page that never connects keeps polling exactly as before.
 */
let live = false
const listeners = new Set<() => void>()

export function setRealtimeLive(next: boolean) {
	if (next === live) return
	live = next
	listeners.forEach(listener => listener())
}

function subscribe(listener: () => void) {
	listeners.add(listener)
	return () => {
		listeners.delete(listener)
	}
}

const read = () => live
const readOnServer = () => false

export function useRealtimeLive(): boolean {
	return useSyncExternalStore(subscribe, read, readOnServer)
}
