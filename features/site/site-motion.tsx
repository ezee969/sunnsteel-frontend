'use client'

import { useEffect } from 'react'

/**
 * SITE-01 §33.9: the landing's motion runtime, one island for the whole
 * page. It switches the motion on (`site-js` on <html> once JavaScript runs,
 * `site-anim` only when neither reduced-motion source asks for stillness),
 * so the HTML the server sends is always the final state; then it watches
 * the page -- never a scroll listener -- and marks what CSS animates:
 *
 * - `data-reveal`: an entrance, once per visit (`data-in`).
 * - `data-play-when`: a script, replayed each time it comes back into view
 *   (`data-play` while at least that share of it is visible), on the layout
 *   `data-play-media` names; a countdown inside it (`data-count-from`) runs
 *   from its sequence step's `--seq`.
 * - `[data-region="night"]`: the top bar takes the Night tokens while it lies
 *   over one, and the page's ground once it leaves (§33.6).
 * - `.site-heading` words are numbered by line so each line rises in turn.
 */
export function prefersStill(): boolean {
	return (
		window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
		document.documentElement.dataset.motion === 'reduce'
	)
}

/** Numbers each word of a heading by the line it sits on. */
function numberLines(heading: HTMLElement) {
	const words = heading.querySelectorAll<HTMLElement>('.site-w')
	let line = -1
	let top = Number.NEGATIVE_INFINITY
	for (const word of words) {
		if (word.offsetTop > top + 2) {
			line += 1
			top = word.offsetTop
		}
		word.style.setProperty('--line', String(line))
	}
	heading.style.setProperty('--lines', String(line + 1))
}

/** Counts a clock (`m:ss`) down, as the rest bar does, over a script. */
function runCountdown(element: HTMLElement) {
	const from = Number(element.dataset.countFrom ?? 0)
	const to = Number(element.dataset.countTo ?? 0)
	const duration = Number(element.dataset.countMs ?? 1000)
	// A step of a sequence starts at its --seq, in seconds.
	const seq = parseFloat(getComputedStyle(element).getPropertyValue('--seq'))
	const delay =
		Number(element.dataset.countDelay ?? 0) +
		(Number.isNaN(seq) ? 0 : seq * 1000)
	const clock = (seconds: number) =>
		`${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`
	element.textContent = clock(from)
	let frame = 0
	const timer = window.setTimeout(() => {
		const start = performance.now()
		const tick = (now: number) => {
			const progress = Math.min(1, (now - start) / duration)
			element.textContent = clock(from + (to - from) * progress)
			if (progress < 1) frame = requestAnimationFrame(tick)
		}
		frame = requestAnimationFrame(tick)
	}, delay)
	return () => {
		window.clearTimeout(timer)
		cancelAnimationFrame(frame)
		element.textContent = clock(to)
	}
}

export function SiteMotion() {
	useEffect(() => {
		const root = document.documentElement
		root.classList.add('site-js')
		const still = prefersStill()
		if (!still) root.classList.add('site-anim')
		const cleanups: Array<() => void> = []

		// The top bar over Night regions (§33.6), with or without motion.
		const bar = document.querySelector<HTMLElement>('.site-bar')
		const nights = document.querySelectorAll('[data-region="night"]')
		if (bar && nights.length > 0) {
			const over = new Set<Element>()
			const strip = new IntersectionObserver(
				entries => {
					for (const entry of entries) {
						if (entry.isIntersecting) over.add(entry.target)
						else over.delete(entry.target)
					}
					const night = over.size > 0
					bar.classList.toggle('dark', night)
					bar.toggleAttribute('data-solid', !night)
				},
				{
					rootMargin: `0px 0px -${Math.max(0, window.innerHeight - 84)}px 0px`,
				},
			)
			nights.forEach(region => strip.observe(region))
			// A sentinel at the page's top tells "scrolled" from "at the top".
			const sentinel = document.createElement('div')
			sentinel.setAttribute('aria-hidden', 'true')
			sentinel.style.cssText =
				'position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none'
			document.body.prepend(sentinel)
			const top = new IntersectionObserver(([entry]) =>
				bar.toggleAttribute('data-scrolled', !entry.isIntersecting),
			)
			top.observe(sentinel)
			// The bar's Get started repeats the hero's one action, so it shows
			// only once that has scrolled away (the owner, 2026-11-22).
			const heroAction = document.querySelector('[data-hero-cta]')
			const action = heroAction
				? new IntersectionObserver(([entry]) =>
						bar.toggleAttribute('data-cta', !entry.isIntersecting),
					)
				: null
			if (heroAction) action?.observe(heroAction)
			else bar.setAttribute('data-cta', '')
			cleanups.push(() => {
				strip.disconnect()
				top.disconnect()
				action?.disconnect()
				sentinel.remove()
			})
		}

		if (still) {
			return () => {
				cleanups.forEach(cleanup => cleanup())
				root.classList.remove('site-js', 'site-anim')
			}
		}

		document.querySelectorAll<HTMLElement>('.site-heading').forEach(numberLines)

		const reveal = new IntersectionObserver(
			entries => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue
					entry.target.setAttribute('data-in', '')
					reveal.unobserve(entry.target)
				}
			},
			{ threshold: 0.2 },
		)
		document
			.querySelectorAll('[data-reveal]')
			.forEach(element => reveal.observe(element))
		cleanups.push(() => reveal.disconnect())

		const countdowns = new Map<Element, () => void>()
		const plays = document.querySelectorAll<HTMLElement>('[data-play-when]')
		const play = new IntersectionObserver(
			entries => {
				for (const entry of entries) {
					const element = entry.target as HTMLElement
					// An element taller than the viewport can never be half in view:
					// it plays once it fills most of the screen instead.
					const viewport = entry.rootBounds?.height ?? window.innerHeight
					const share = Math.min(
						Number(element.dataset.playWhen ?? 0.5),
						(viewport * 0.8) / entry.boundingClientRect.height,
					)
					if (entry.intersectionRatio >= share - 0.01) {
						if (element.hasAttribute('data-play')) continue
						element.setAttribute('data-play', '')
						element
							.querySelectorAll<HTMLElement>('[data-count-from]')
							.forEach(clock => {
								countdowns.get(clock)?.()
								countdowns.set(clock, runCountdown(clock))
							})
					} else if (!entry.isIntersecting) {
						// Fully out of view: the script replays on re-entry.
						element.removeAttribute('data-play')
					}
				}
			},
			{ threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5] },
		)
		plays.forEach(element => {
			// `data-play-media` limits a script to the layout it belongs to: the
			// tools grid plays as one sequence on desktop, card by card on phones.
			const media = element.dataset.playMedia
			if (media && !window.matchMedia(media).matches) return
			play.observe(element)
		})
		cleanups.push(() => {
			play.disconnect()
			countdowns.forEach(stop => stop())
		})

		return () => {
			cleanups.forEach(cleanup => cleanup())
			root.classList.remove('site-js', 'site-anim')
		}
	}, [])

	return null
}
