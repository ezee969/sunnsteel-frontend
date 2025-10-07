import type { KeyboardEvent } from 'react'

type KeyboardHandler = (event: KeyboardEvent<HTMLElement>) => void

export function createEnterSpaceHandler(action: () => void): KeyboardHandler {
	return (event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			action()
		}
	}
}
