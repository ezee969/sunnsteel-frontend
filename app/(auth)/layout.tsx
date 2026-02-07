'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ModeToggle } from '@/components/mode-toggle'
import { ModernBrandHero } from './components/ModernBrandHero'
import { ModernBackground } from './components/ModernBackground'

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const [mounted, setMounted] = useState(false)
	const [isAnimating, setIsAnimating] = useState(true)

	useEffect(() => {
		setMounted(true)
	}, [])
	return (
		<div className="min-h-screen w-full flex bg-white dark:bg-neutral-950 transition-colors duration-300">
			{/* Left Side - Form Container */}
			<div className="w-full lg:w-[45%] flex flex-col relative border-r border-neutral-200 dark:border-neutral-800">
				{mounted ? (
					<div className="relative z-20 flex justify-center lg:justify-start px-8 py-8 lg:py-12 lg:px-12">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, ease: "easeOut" }}
							className="flex flex-col items-center lg:items-start"
						>
							<h1 className="text-3xl lg:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-500 mb-1 drop-shadow-xl">
								sunnsteel
							</h1>
							<div className="flex items-center gap-2 opacity-80">
								<div className="h-px w-8 bg-gradient-to-l from-amber-600 dark:from-amber-400 to-transparent" />
								<div className="h-2 w-2 rotate-45 border border-amber-600/60 dark:border-amber-400/60 bg-amber-600/20 dark:bg-amber-500/20" />
								<div className="h-px w-8 bg-gradient-to-r from-amber-600 dark:from-amber-400 to-transparent" />
							</div>
						</motion.div>
					</div>
				) : (
					<div className="h-32" /> // Stable placeholder while hydrating
				)}

				<div className="hidden lg:block absolute inset-0 z-0 bg-white dark:bg-neutral-950" />
				<div className="lg:hidden absolute inset-0 z-0">
					{mounted && <ModernBackground />}
				</div>

				<div className={`flex-1 flex flex-col relative z-10 ${isAnimating ? 'overflow-hidden' : 'overflow-y-auto'}`}>
					<AnimatePresence mode="wait">
						{mounted && (
							<motion.div
								key="auth-content"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
								onAnimationComplete={() => setIsAnimating(false)}
								className="w-full max-w-sm sm:max-w-md mx-auto my-auto p-6 sm:p-10"
							>
								{children}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>

            {/* Right Side (Desktop) - Branding & Hero */}
			<div className="hidden lg:flex flex-1 relative flex-col items-center justify-center bg-neutral-950 overflow-hidden">
                <div className="absolute right-8 top-8 z-50">
					{mounted && <ModeToggle />}
				</div>
                {mounted && <ModernBrandHero />}
			</div>
		</div>
	)
}
