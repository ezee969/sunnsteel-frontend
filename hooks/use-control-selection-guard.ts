'use client'

import { useEffect } from 'react'

import { cancelsMultiClickSelection } from '@/lib/utils/control-selection'

const DISABLED = ":disabled, [aria-disabled='true']"

/**
 * What the pointer is over. A disabled `Button` takes no pointer events
 * (`disabled:pointer-events-none`), so the press lands on the row around it;
 * the disabled control under the pointer is found by its box instead.
 */
function underPointer(event: MouseEvent): EventTarget | null {
	const target = event.target
	if (!(target instanceof Element)) return target
	for (const control of target.querySelectorAll(DISABLED)) {
		const box = control.getBoundingClientRect()
		if (
			event.clientX >= box.left &&
			event.clientX <= box.right &&
			event.clientY >= box.top &&
			event.clientY <= box.bottom
		) {
			return control
		}
	}
	return target
}

/**
 * UX-27 (design system §34): a double- or triple-click on a control selects
 * nothing, not even the content beside it (Chromium otherwise selects the
 * nearest selectable line: Schedule's disabled This month button selected the
 * legend under it). Listens once for the whole app, in the capture phase so a
 * component that stops the event cannot let one through.
 */
export function useControlSelectionGuard() {
	useEffect(() => {
		const onMouseDown = (event: MouseEvent) => {
			if (event.detail < 2) return
			if (cancelsMultiClickSelection(underPointer(event), event.detail)) {
				event.preventDefault()
			}
		}
		document.addEventListener('mousedown', onMouseDown, true)
		return () => document.removeEventListener('mousedown', onMouseDown, true)
	}, [])
}
