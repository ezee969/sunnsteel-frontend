import { describe, expect, it } from 'vitest'

import {
	getSplashMotion,
	MOTION_PREFERENCE_SCRIPT,
	parseMotionPreference,
	resolveReducedMotion,
} from '@/lib/utils/motion-preference'

describe('motion preference', () => {
	it('treats anything but an explicit reduce as following the device', () => {
		expect(parseMotionPreference('reduce')).toBe('reduce')
		expect(parseMotionPreference('system')).toBe('system')
		expect(parseMotionPreference(null)).toBe('system')
		expect(parseMotionPreference('full')).toBe('system')
	})

	it('can add reduction but never overrides the operating system', () => {
		expect(resolveReducedMotion('system', false)).toBe(false)
		expect(resolveReducedMotion('system', true)).toBe(true)
		expect(resolveReducedMotion('reduce', false)).toBe(true)
		expect(resolveReducedMotion('reduce', true)).toBe(true)
	})

	it('applies a stored preference before paint without throwing', () => {
		const attributes = new Map<string, string>()
		const run = new Function(
			'localStorage',
			'document',
			MOTION_PREFERENCE_SCRIPT,
		)
		const document = {
			documentElement: {
				setAttribute: (name: string, value: string) =>
					attributes.set(name, value),
			},
		}
		run({ getItem: () => 'reduce' }, document)
		expect(attributes.get('data-motion')).toBe('reduce')

		attributes.clear()
		run({ getItem: () => null }, document)
		expect(attributes.size).toBe(0)

		expect(() =>
			run(
				{
					getItem: () => {
						throw new Error('SecurityError')
					},
				},
				document,
			),
		).not.toThrow()
	})
})

describe('splash motion', () => {
	it('keeps the staggered entrance with full motion', () => {
		const motion = getSplashMotion(false)
		expect(motion.fade(0.4)).toEqual({ duration: 0.3, delay: 0.4 })
		expect(motion.pulseDots).toBe(true)
		expect(motion.animateProgress).toBe(true)
	})

	it('drops stagger, loops and growth under reduced motion', () => {
		const motion = getSplashMotion(true)
		expect(motion.fade(0.4, 0.35)).toEqual({ duration: 0.12, delay: 0 })
		expect(motion.exitDuration).toBe(0.12)
		expect(motion.contentFadeDuration).toBe(0.12)
		expect(motion.pulseDots).toBe(false)
		expect(motion.animateProgress).toBe(false)
	})
})
