'use client'

import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

/**
 * SITE-01 §12.2 and §33.7: the hero's background footage. The poster is the
 * LCP element and is always rendered; the clip is requested only after the
 * page's `load`, when the browser is idle, and never under either
 * reduced-motion source or `Save-Data`. Phones get their own light cut. The
 * scrim is baked into every file (§33.4), so nothing is laid over it here.
 */
const SOURCES = {
	phone: {
		webm: '/site/video/hero-phone.webm',
		mp4: '/site/video/hero-phone.mp4',
	},
	desktop: {
		webm: '/site/video/hero-desktop.webm',
		mp4: '/site/video/hero-desktop.mp4',
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
}: {
	pauseLabel: string
	playLabel: string
}) {
	const video = useRef<HTMLVideoElement>(null)
	const [enabled, setEnabled] = useState(false)
	const [shown, setShown] = useState(false)
	const [paused, setPaused] = useState(false)

	useEffect(() => {
		if (prefersStill()) return
		whenIdle(() => setEnabled(true))
	}, [])

	useEffect(() => {
		const element = video.current
		if (!enabled || !element) return
		const cut = window.matchMedia(PHONE_QUERY).matches
			? SOURCES.phone
			: SOURCES.desktop
		element.src = element.canPlayType('video/webm; codecs="av01.0.05M.08"')
			? cut.webm
			: cut.mp4
		element.play().catch(() => setPaused(true))
	}, [enabled])

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
