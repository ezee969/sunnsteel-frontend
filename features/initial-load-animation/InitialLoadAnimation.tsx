'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'

import { ClassicalIcon } from '@/components/icons/ClassicalIcon'

import { CORNER_ACCENTS, CornerAccent } from './corner-accent'

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
					<motion.div
						key="loading"
						className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black"
						initial={{ opacity: 1 }}
						exit={{
							opacity: 0,
							transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
						}}
					>
						{/* Dynamic Background with Ken Burns Effect */}
						<motion.div
							className="absolute inset-0"
							initial={{ scale: 1.08, opacity: 0 }}
							animate={{
								scale: 1,
								opacity: 1,
							}}
							transition={{
								scale: { duration: 1.7, ease: 'easeOut' },
								opacity: { duration: 0.35, ease: 'easeIn' },
							}}
						>
							<div className="absolute inset-0">
								<Image
									src={backgroundImage}
									alt="Training background"
									fill
									className="object-cover object-center"
									priority
								/>
							</div>

							{/* Sophisticated Multi-layer Gradient System */}
							<div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/85" />
							<div className="absolute inset-0 bg-gradient-to-t from-amber-950/40 via-transparent to-transparent" />
							<div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

							{/* Premium Vignette */}
							<div
								className="absolute inset-0"
								style={{
									background:
										'radial-gradient(ellipse 80% 60% at 50% 45%, transparent 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.9) 100%)',
								}}
							/>
						</motion.div>

						{/* Animated Corner Accents */}
						{CORNER_ACCENTS.map(({ position, delay }) => (
							<CornerAccent key={position} position={position} delay={delay} />
						))}

						{/* Elegant Inner Frame */}
						<motion.div
							className="absolute inset-6 sm:inset-8 border border-amber-400/20 rounded-sm"
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
						/>

						{/* Main Content Container */}
						<motion.div
							className="relative z-10 text-center max-w-5xl mx-auto px-6 sm:px-8"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.3, delay: 0.05 }}
						>
							{/* Powerful Brand Section */}
							<motion.div
								className="mb-10 sm:mb-14"
								initial={{ opacity: 0, y: 40, scale: 0.9 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								transition={{
									duration: 0.5,
									delay: 0.15,
									ease: [0.25, 0.1, 0.25, 1],
								}}
							>
								{/* Main Logo/Title */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.4, delay: 0.25 }}
								>
									<h1
										className="text-5xl sm:text-7xl lg:text-9xl font-black tracking-tight mb-3 sm:mb-5"
										style={{
											background:
												'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #DAA520 100%)',
											WebkitBackgroundClip: 'text',
											WebkitTextFillColor: 'transparent',
											backgroundClip: 'text',
											fontFamily: '"Cinzel", "Times New Roman", serif',
											textShadow: '0 4px 20px rgba(218, 165, 32, 0.4)',
											filter:
												'drop-shadow(0 0 30px rgba(255, 215, 0, 0.3)) drop-shadow(0 2px 8px rgba(0,0,0,0.9))',
											letterSpacing: '0.02em',
											fontWeight: '900',
										}}
									>
										SUNNSTEEL
									</h1>
								</motion.div>

								{/* Refined Divider with Icon */}
								<motion.div
									className="flex items-center justify-center mb-5 sm:mb-7"
									initial={{ scaleX: 0, opacity: 0 }}
									animate={{ scaleX: 1, opacity: 1 }}
									transition={{
										duration: 0.4,
										delay: 0.4,
										ease: [0.4, 0, 0.2, 1],
									}}
								>
									<motion.div
										className="h-px bg-gradient-to-r from-transparent via-amber-400/80 to-amber-500/60"
										style={{ width: 'clamp(2rem, 8vw, 5rem)' }}
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: 0.45, duration: 0.3 }}
									/>
									<motion.div
										initial={{ scale: 0, rotate: -180 }}
										animate={{ scale: 1, rotate: 0 }}
										transition={{
											delay: 0.5,
											duration: 0.4,
											type: 'spring',
											stiffness: 260,
											damping: 18,
										}}
									>
										<ClassicalIcon
											name="laurel-crown"
											className="w-7 h-7 sm:w-10 sm:h-10 mx-4 sm:mx-7"
											style={{
												color: '#FFD700',
												filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))',
											}}
										/>
									</motion.div>
									<motion.div
										className="h-px bg-gradient-to-l from-transparent via-amber-400/80 to-amber-500/60"
										style={{ width: 'clamp(2rem, 8vw, 5rem)' }}
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: 0.45, duration: 0.3 }}
									/>
								</motion.div>

								{/* Motivational Tagline */}
								<motion.p
									className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-wide uppercase"
									style={{
										color: '#E5C687',
										fontFamily: '"Cinzel", "Times New Roman", serif',
										textShadow:
											'0 0 15px rgba(229, 198, 135, 0.5), 0 2px 4px rgba(0,0,0,0.9)',
										letterSpacing: '0.15em',
									}}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.55, duration: 0.35, ease: 'easeOut' }}
								>
									Forge Your Legacy
								</motion.p>
							</motion.div>

							{/* Modern Loading Section */}
							<motion.div
								className="flex flex-col items-center space-y-5 sm:space-y-6"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.65, duration: 0.3 }}
							>
								{/* Loading Text */}
								<motion.div
									className="flex items-center space-x-3"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.7, duration: 0.25 }}
								>
									<motion.p
										className="text-base sm:text-lg lg:text-xl font-semibold tracking-wider uppercase"
										style={{
											color: '#FFD700',
											fontFamily: '"Cinzel", "Times New Roman", serif',
											textShadow:
												'0 0 12px rgba(255, 215, 0, 0.6), 0 2px 4px rgba(0,0,0,0.8)',
											letterSpacing: '0.12em',
										}}
									>
										Preparing Your Journey
									</motion.p>

									{/* Animated Dots */}
									<motion.div className="flex space-x-1">
										{[0, 1, 2].map(i => (
											<motion.div
												key={i}
												className="w-1.5 h-1.5 rounded-full bg-amber-400"
												animate={{
													opacity: [0.3, 1, 0.3],
													scale: [0.8, 1.2, 0.8],
												}}
												transition={{
													duration: 0.9,
													repeat: Infinity,
													delay: i * 0.15,
													ease: 'easeInOut',
												}}
											/>
										))}
									</motion.div>
								</motion.div>

								{/* Premium Progress Bar */}
								<motion.div
									className="w-full max-w-xs sm:max-w-sm"
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: 0.75, duration: 0.25 }}
								>
									<div className="relative h-2 bg-gradient-to-r from-amber-950/40 via-amber-900/30 to-amber-950/40 rounded-full overflow-hidden border border-amber-700/30 shadow-inner">
										{/* Shimmer Effect Background */}
										<motion.div
											className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent"
											animate={{
												x: ['-100%', '200%'],
											}}
											transition={{
												duration: 1.1,
												repeat: Infinity,
												ease: 'linear',
											}}
										/>

										{/* Main Progress Bar */}
										<motion.div
											className="relative h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 rounded-full"
											style={{
												boxShadow:
													'0 0 20px rgba(255, 215, 0, 0.6), inset 0 1px 2px rgba(255,255,255,0.3)',
											}}
											initial={{ width: '0%' }}
											animate={{ width: '100%' }}
											transition={{
												duration: 0.35,
												delay: 0.85,
												ease: [0.4, 0, 0.2, 1],
											}}
										>
											{/* Glowing Edge Effect */}
											<motion.div
												className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-amber-300 to-transparent"
												animate={{
													opacity: [0.6, 1, 0.6],
												}}
												transition={{
													duration: 0.8,
													repeat: Infinity,
													ease: 'easeInOut',
												}}
											/>
										</motion.div>
									</div>
								</motion.div>
							</motion.div>
						</motion.div>

						{/* Subtle Particle Effect Overlay */}
						<motion.div
							className="absolute inset-0 pointer-events-none"
							initial={{ opacity: 0 }}
							animate={{ opacity: 0.4 }}
							transition={{ delay: 0.35, duration: 0.5 }}
						>
							{[...Array(8)].map((_, i) => (
								<motion.div
									key={i}
									className="absolute w-1 h-1 bg-amber-400/40 rounded-full"
									style={{
										left: `${Math.random() * 100}%`,
										top: `${Math.random() * 100}%`,
									}}
									animate={{
										y: [0, -30, 0],
										opacity: [0, 0.8, 0],
										scale: [0, 1, 0],
									}}
									transition={{
										duration: 1.5 + Math.random(),
										repeat: Infinity,
										delay: Math.random() * 0.6,
										ease: 'easeInOut',
									}}
								/>
							))}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Content is mounted from the first frame, hidden underneath the splash.
          Mounting is what starts the page's queries, so the app loads *during*
          the animation. Only its opacity is animated as the overlay clears. */}
			<motion.div
				initial={false}
				animate={{
					opacity: showContent ? 1 : 0,
					scale: showContent ? 1 : 0.98,
				}}
				transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
				className="min-h-screen"
			>
				{children}
			</motion.div>
		</>
	)
}
