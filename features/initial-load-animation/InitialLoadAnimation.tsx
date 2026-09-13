'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'

import { ClassicalIcon } from '@/components/icons/ClassicalIcon'

let hasShownInitialLoader = false

/**
 * How long the splash stays up. Long enough for the entrance choreography to
 * complete as one beat, short enough that it never reads as waiting.
 *
 * The important part is not this number but that `children` mount on the first
 * frame (see the render below): the splash is an overlay *on top of* the app
 * loading, not a gate *in front of* it. Page queries fire during the animation
 * instead of after it, so this time overlaps real work rather than adding to it.
 */
const SPLASH_DURATION_MS = 1200

const MOBILE_BACKGROUNDS = [
	'/backgrounds/mobile-loader-bg-1.webp',
	'/backgrounds/mobile-loader-bg-2.webp',
	'/backgrounds/mobile-loader-bg-3.webp',
	'/backgrounds/mobile-loader-bg-4.webp',
	'/backgrounds/mobile-loader-bg-5.webp',
	'/backgrounds/mobile-loader-bg-6.webp',
	'/backgrounds/mobile-loader-bg-7.webp',
	'/backgrounds/mobile-loader-bg-8.webp',
	'/backgrounds/mobile-loader-bg-9.webp',
]

const getRandomMobileBackground = () =>
	MOBILE_BACKGROUNDS[Math.floor(Math.random() * MOBILE_BACKGROUNDS.length)]

/** `--ease-standard` (design system §9). */
const EASE_STANDARD = [0.2, 0, 0, 1] as const

/**
 * One opacity fade, staggered by `delay`. The splash animates opacity only
 * (motion spec §4-§5): the rise, scale, spin, shimmer sweep and floating
 * particles it used to run are all on that spec's prohibited list.
 */
const fadeIn = (delay: number, duration = 0.3) => ({
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	transition: { duration, delay, ease: EASE_STANDARD },
})

interface InitialLoadAnimationProps {
	children: React.ReactNode
}

export const InitialLoadAnimation = ({
	children,
}: InitialLoadAnimationProps) => {
	const [shouldAnimate] = useState(
		() =>
			typeof window !== 'undefined' &&
			window.innerWidth < 1024 &&
			!hasShownInitialLoader,
	)
	const [isLoading, setIsLoading] = useState(shouldAnimate)
	const [showContent, setShowContent] = useState(!shouldAnimate)
	const [backgroundImage, setBackgroundImage] = useState(MOBILE_BACKGROUNDS[0])
	const hasRandomizedBackground = useRef(false)

	useEffect(() => {
		if (!shouldAnimate) {
			return
		}

		hasShownInitialLoader = true

		if (!hasRandomizedBackground.current) {
			setBackgroundImage(getRandomMobileBackground())
			hasRandomizedBackground.current = true
		}

		const exitTimer = setTimeout(() => {
			setShowContent(true)
			setIsLoading(false)
		}, SPLASH_DURATION_MS)

		return () => clearTimeout(exitTimer)
	}, [shouldAnimate])

	return (
		<>
			<AnimatePresence mode="wait">
				{isLoading && (
					// TD-31: the splash is on the system's tokens. Its ground is the
					// theme's ground rather than black; the photograph stays, and the
					// type sits on an opaque `panel` (§11.5) instead of on three
					// gradient scrims and a vignette — no gradient, glow, coloured
					// shadow or translucency (§4.3 rule 6, §8, §9.2, §11.5).
					<motion.div
						key="loading"
						className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background"
						initial={{ opacity: 1 }}
						exit={{
							opacity: 0,
							transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
						}}
					>
						<motion.div className="absolute inset-0" {...fadeIn(0, 0.35)}>
							<Image
								src={backgroundImage}
								alt="Training background"
								fill
								className="object-cover object-center"
								priority
							/>
						</motion.div>

						<motion.div
							className="relative z-10 mx-4 flex max-w-lg flex-col items-center rounded-sm border border-rule bg-surface px-5 py-10 text-center sm:mx-6 sm:px-12 sm:py-12"
							{...fadeIn(0.05)}
						>
							{/* The screen's one pair of corner brackets (§11.11), in place
							    of the four amber corner frames and the inner frame. Not a
							    heading: the page mounted underneath already has its h1. */}
							<motion.p
								className="type-wordmark corner-brackets inline-block text-3xl text-foreground sm:text-6xl"
								{...fadeIn(0.15)}
							>
								SUNNSTEEL
							</motion.p>

							<motion.div
								className="my-5 flex items-center justify-center gap-4 sm:my-7"
								aria-hidden
								{...fadeIn(0.3)}
							>
								<span className="h-px w-8 bg-rule sm:w-16" />
								{/* Ink, not gold: honour marks only what is earned
								    (§4.3 rule 3), and a splash has earned nothing yet. */}
								<ClassicalIcon
									name="laurel-crown"
									className="size-7 text-ink-3 sm:size-9"
								/>
								<span className="h-px w-8 bg-rule sm:w-16" />
							</motion.div>

							<motion.p className="type-section text-ink-2" {...fadeIn(0.4)}>
								Forge Your Legacy
							</motion.p>

							<motion.div
								className="mt-8 flex w-full flex-col items-center gap-4 sm:mt-10"
								{...fadeIn(0.55)}
							>
								<div className="flex items-center gap-3">
									<p className="type-label text-ink-3">
										Preparing Your Journey
									</p>
									<div className="flex gap-1" aria-hidden>
										{[0, 1, 2].map(i => (
											<motion.span
												key={i}
												className="size-1.5 bg-ink-3"
												animate={{ opacity: [0.3, 1, 0.3] }}
												transition={{
													duration: 0.9,
													repeat: Infinity,
													delay: i * 0.15,
													ease: 'easeInOut',
												}}
											/>
										))}
									</div>
								</div>

								{/* A square track with an ink fill: loading is progress,
								    not honour, and radius is for avatars only (§7). */}
								<div className="h-0.5 w-full max-w-xs overflow-hidden bg-rule-faint">
									<motion.div
										className="h-full bg-foreground"
										initial={{ width: '0%' }}
										animate={{ width: '100%' }}
										transition={{
											duration: 0.35,
											delay: 0.85,
											ease: [0.4, 0, 0.2, 1],
										}}
									/>
								</div>
							</motion.div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Content is mounted from the first frame, hidden underneath the splash.
          Mounting is what starts the page's queries, so the app loads *during*
          the animation. Only its opacity is animated as the overlay clears —
          the 0.98 scale it also ran is gone, per the gotcha in AGENTS.md. */}
			<motion.div
				initial={false}
				animate={{ opacity: showContent ? 1 : 0 }}
				transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
				className="min-h-screen"
			>
				{children}
			</motion.div>
		</>
	)
}
