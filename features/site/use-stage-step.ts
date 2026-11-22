'use client'

import { useEffect } from 'react'

/**
 * SITE-01 §33.9: a sticky stage's step, read from markers crossing the
 * viewport's centre -- IntersectionObservers, never a scroll listener. The
 * stage itself is watched too, so a jump past it (an anchor link, the end
 * key) leaves it on its last step, and a jump back above it on its first.
 */
export function useStageStep(
	stage: () => HTMLElement | null | undefined,
	markerSelector: string,
	enabled: boolean,
	onStep: (step: number) => void,
) {
	useEffect(() => {
		const root = stage()
		if (!enabled || !root) return
		const markers = Array.from(
			root.querySelectorAll<HTMLElement>(markerSelector),
		)
		if (markers.length === 0) return

		const centre = new IntersectionObserver(
			entries => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						onStep(markers.indexOf(entry.target as HTMLElement))
					}
				}
			},
			{ rootMargin: '-50% 0px -50% 0px' },
		)
		markers.forEach(marker => centre.observe(marker))

		// The first report only says where the stage starts; a stage below the
		// fold is already on its first step and must not count as reached.
		let first = true
		const around = new IntersectionObserver(([entry]) => {
			const middle = window.innerHeight / 2
			if (entry.boundingClientRect.bottom < middle) onStep(markers.length - 1)
			else if (entry.boundingClientRect.top > middle && !first) onStep(0)
			first = false
		})
		around.observe(root)

		return () => {
			centre.disconnect()
			around.disconnect()
		}
	}, [stage, markerSelector, enabled, onStep])
}
