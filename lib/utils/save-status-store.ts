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
  listeners.forEach((l) => l())
}

export function setSaveState(key: string, state: SaveState, message?: string) {
  store.set(key, { state, updatedAt: Date.now(), message })
  emit()
}

export function getSaveState(key: string): Entry | undefined {
  return store.get(key)
}

// Auto-transition from 'saved' back to 'idle' after a short dwell to keep UI calm
const SAVED_DWELL_MS = 2000
let ticking = false
function tick() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    const now = Date.now()
    let changed = false
    for (const [k, v] of store.entries()) {
      if (v.state === 'saved' && now - v.updatedAt > SAVED_DWELL_MS) {
        store.set(k, { state: 'idle', updatedAt: now })
        changed = true
      }
    }
    if (changed) emit()
    ticking = false
  })
}

// Public hook for components
export function useSaveState(key: string) {
  const [entry, setEntry] = useState<Entry | undefined>(() => getSaveState(key))
  useEffect(() => {
    const listener = () => {
      setEntry(getSaveState(key))
      tick()
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
