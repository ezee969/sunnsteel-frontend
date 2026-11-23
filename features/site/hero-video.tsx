'use client'

import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

/**
 * SITE-01 §12.2, §12.12, §33.7 and §33.15: a band's background footage. The
 * poster is always rendered (the hero's is the LCP element); the clip is
 * requested only after the page's `load`, when the browser is idle -- and,
 * for every band but the hero, once the band is within a screen of the
 * viewport -- never
 * under either reduced-motion source or `Save-Data`. Phones get the hero's
 * light cut and no closing clip at all. The scrim is baked into every file
 * (§33.4), so nothing is laid over it here.
 */
type Cut = { webm: string; mp4: string }
type Band = 'hero' | 'closing' | 'chalk' | 'bar'
const CUTS: Record<Band, { phone: Cut | null; desktop: Cut }> = {
	hero: {
		phone: {
			webm: '/site/video/hero-phone.webm',
			mp4: '/site/video/hero-phone.mp4',
		},
		desktop: {
			webm: '/site/video/hero-desktop.webm',
			mp4: '/site/video/hero-desktop.mp4',
		},
	},
	closing: {
		phone: null,
		desktop: {
			webm: '/site/video/closing-desktop.webm',
			mp4: '/site/video/closing-desktop.mp4',
		},
	},
	// §33.15: the interludes, computers only, like the closing band.
	chalk: {
		phone: null,
		desktop: {
			webm: '/site/video/interlude-chalk.webm',
			mp4: '/site/video/interlude-chalk.mp4',
		},
	},
	bar: {
		phone: null,
		desktop: {
			webm: '/site/video/interlude-bar.webm',
			mp4: '/site/video/interlude-bar.mp4',
		},
	},
}

const PHONE_QUERY = '(max-width: 767px)'

function prefersStill() {
	const reduce =
		window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
		document.documentElement.dataset.motion === 'reduce'
	const saveData = (
		navigator as Navigator & { connection?: { saveData?: boolean } }
	).connection?.saveData
	return reduce || saveData === true
}

function whenIdle(run: () => void) {
	// Safari has no requestIdleCallback; a short timeout stands in for it.
	const later = () =>
		typeof window.requestIdleCallback === 'function'
			? window.requestIdleCallback(run, { timeout: 2000 })
			: setTimeout(run, 200)
	if (document.readyState === 'complete') later()
	else window.addEventListener('load', later, { once: true })
}

export function HeroVideo({
	pauseLabel,
	playLabel,
	cut = 'hero',
}: {
	pauseLabel: string
	playLabel: string
	cut?: Band
}) {
	const video = useRef<HTMLVideoElement>(null)
	const [enabled, setEnabled] = useState(false)
	const [shown, setShown] = useState(false)
	const [paused, setPaused] = useState(false)

	useEffect(() => {
		if (prefersStill()) return
		const phone = window.matchMedia(PHONE_QUERY).matches
		if (phone && !CUTS[cut].phone) return
		if (cut === 'hero') {
			whenIdle(() => setEnabled(true))
			return
		}
		const element = video.current
		if (!element) return
		const near = new IntersectionObserver(
			entries => {
				if (!entries.some(entry => entry.isIntersecting)) return
				near.disconnect()
				whenIdle(() => setEnabled(true))
			},
			{ rootMargin: '100% 0px' },
		)
		near.observe(element)
		return () => near.disconnect()
	}, [cut])

	useEffect(() => {
		const element = video.current
		if (!enabled || !element) return
		const sources = CUTS[cut]
		const chosen =
			window.matchMedia(PHONE_QUERY).matches && sources.phone
				? sources.phone
				: sources.desktop
		element.src = element.canPlayType('video/webm; codecs="av01.0.05M.08"')
			? chosen.webm
			: chosen.mp4
		element.play().catch(() => setPaused(true))
	}, [enabled, cut])

	const toggle = () => {
		const element = video.current
		if (!element) return
		if (element.paused) {
			void element.play()
			setPaused(false)
		} else {
			element.pause()
			setPaused(true)
		}
	}

	return (
		<>
			<video
				ref={video}
				aria-hidden="true"
				muted
				loop
				playsInline
				preload="none"
				onPlaying={() => setShown(true)}
				className={cn(
					'absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-[600ms] ease-standard',
					shown && 'opacity-100',
				)}
			/>
			{enabled ? (
				<button
					type="button"
					onClick={toggle}
					aria-label={paused ? playLabel : pauseLabel}
					className="site-video-control absolute z-10 grid size-11 place-items-center text-foreground"
				>
					<span className="grid size-8 place-items-center rounded-full border border-ink-2">
						{paused ? (
							<Play className="size-3" aria-hidden />
						) : (
							<Pause className="size-3" aria-hidden />
						)}
					</span>
				</button>
			) : null}
		</>
	)
}
