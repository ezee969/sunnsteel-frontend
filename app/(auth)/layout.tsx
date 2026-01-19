'use client'

import type React from 'react'
import { motion } from 'framer-motion'
import { ModeToggle } from '@/components/mode-toggle'
import { BackgroundOverlay } from './components/BackgroundOverlay'

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className="h-screen w-full fixed inset-0 overflow-hidden bg-white dark:bg-neutral-950 transition-colors duration-300">
			<BackgroundOverlay />

			{/* Top-right theme toggle */}
			<div className="relative z-20">
				<div className="absolute right-3 top-3 sm:right-4 sm:top-4">
					<ModeToggle />
				</div>
			</div>

			{/* Subtle gold top border accent */}
			<div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent dark:via-amber-300/60" />

			<div className="relative z-10 h-full w-full overflow-y-auto overflow-x-hidden">
				<div className="flex flex-col items-center justify-center min-h-full py-8 px-4 sm:px-6">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, ease: 'easeOut' }}
						className="w-full max-w-md"
					>
						{children}
					</motion.div>
				</div>
			</div>
		</div>
	)
}
