'use client'

import { type RefObject, useEffect } from 'react'

import {
	HASH_ALIGN_WINDOW_MS,
	hashTargetId,
	hashTargetPlacement,
} from '@/lib/utils/settings-anchor'

const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown']

/**
 * Brings the element the location hash names into view once `ready`, then
 * keeps it there while the content above it finishes loading and grows. It
 * stops after a few seconds, or as soon as the person scrolls, types or taps,
 * so it never fights them. The jump is always instant (§9.3).
 */
export function useScrollToHash(
	contentRef: RefObject<HTMLElement | null>,
	ready: boolean,
) {
	useEffect(() => {
		if (!ready) return

		let stop: (() => void) | undefined

		const run = () => {
			stop?.()
			const id = hashTargetId(window.location.hash)
			if (!id) return

			let focused = false
			const align = () => {
				const target = document.getElementById(id)
				if (!target) return
				const placement = hashTargetPlacement(target.tagName)
				target.scrollIntoView({
					block: placement === 'control' ? 'center' : 'start',
					behavior: 'instant' as ScrollBehavior,
				})
				if (placement === 'control' && !focused) {
					target.focus({ preventScroll: true })
					focused = true
				}
			}

			align()
			const observer =
				typeof ResizeObserver === 'undefined' || !contentRef.current
					? null
					: new ResizeObserver(align)
			if (observer && contentRef.current) observer.observe(contentRef.current)
			const timer = window.setTimeout(() => stop?.(), HASH_ALIGN_WINDOW_MS)
			const cancel = () => stop?.()
			for (const type of USER_SCROLL_EVENTS) {
				window.addEventListener(type, cancel, { capture: true, passive: true })
			}
			stop = () => {
				observer?.disconnect()
				window.clearTimeout(timer)
				for (const type of USER_SCROLL_EVENTS) {
					window.removeEventListener(type, cancel, { capture: true })
				}
				stop = undefined
			}
		}

		run()
		window.addEventListener('hashchange', run)
		return () => {
			window.removeEventListener('hashchange', run)
			stop?.()
		}
	}, [contentRef, ready])
}
