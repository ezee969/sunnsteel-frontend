import React from 'react'
import { motion } from 'framer-motion'

type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface CornerAccentProps {
	position: CornerPosition
	delay: number
}

const cornerAccentStyles: Record<CornerPosition, { className: string; initial: { x: number; y: number } }> = {
	'top-left': {
		className: 'top-4 left-4 border-l-2 border-t-2',
		initial: { x: -20, y: -20 },
	},
	'top-right': {
		className: 'top-4 right-4 border-r-2 border-t-2',
		initial: { x: 20, y: -20 },
	},
	'bottom-left': {
		className: 'bottom-4 left-4 border-l-2 border-b-2',
		initial: { x: -20, y: 20 },
	},
	'bottom-right': {
		className: 'bottom-4 right-4 border-r-2 border-b-2',
		initial: { x: 20, y: 20 },
	},
}

export const CORNER_ACCENTS: CornerAccentProps[] = [
	{ position: 'top-left', delay: 0.3 },
	{ position: 'top-right', delay: 0.3 },
	{ position: 'bottom-left', delay: 0.3 },
	{ position: 'bottom-right', delay: 0.3 },
]

export const CornerAccent = ({ position, delay }: CornerAccentProps) => {
	const { className, initial } = cornerAccentStyles[position]

	return (
		<motion.div
			className={`absolute w-16 h-16 sm:w-20 sm:h-20 border-amber-500/60 ${className}`}
			initial={{ opacity: 0, ...initial }}
			animate={{ opacity: 1, x: 0, y: 0 }}
			transition={{ duration: 0.8, delay, ease: 'easeOut' }}
		/>
	)
}
