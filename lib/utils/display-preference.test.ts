import { describe, expect, it } from 'vitest'

import {
	DISPLAY_PREFERENCE_SCRIPT,
	parseContrastPreference,
	parseControlSizePreference,
	resolveHigherContrast,
} from './display-preference'

describe('display preferences', () => {
	it('reads only the stored values that turn something on', () => {
		expect(parseContrastPreference('more')).toBe('more')
		expect(parseContrastPreference('less')).toBe('system')
		expect(parseContrastPreference(null)).toBe('system')
		expect(parseControlSizePreference('large')).toBe('large')
		expect(parseControlSizePreference('huge')).toBe('standard')
		expect(parseControlSizePreference(undefined)).toBe('standard')
	})

	it('lets the device add higher contrast but never remove what the OS asks for', () => {
		expect(resolveHigherContrast('more', false)).toBe(true)
		expect(resolveHigherContrast('system', true)).toBe(true)
		expect(resolveHigherContrast('system', false)).toBe(false)
	})

	it('applies both stored choices before first paint and survives blocked storage', () => {
		const attributes: Record<string, string> = {}
		const run = (storage: Record<string, string> | 'blocked') =>
			new Function('localStorage', 'document', DISPLAY_PREFERENCE_SCRIPT)(
				storage === 'blocked'
					? {
							getItem: () => {
								throw new Error('SecurityError')
							},
						}
					: { getItem: (key: string) => storage[key] ?? null },
				{
					documentElement: {
						setAttribute: (name: string, value: string) => {
							attributes[name] = value
						},
					},
				},
			)
		run({ 'ss-contrast': 'more', 'ss-controls': 'large' })
		expect(attributes).toEqual({
			'data-contrast': 'more',
			'data-controls': 'large',
		})
		expect(() => run('blocked')).not.toThrow()
	})
})
