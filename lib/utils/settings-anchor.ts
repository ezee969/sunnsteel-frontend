import type { ProfilePrivacySettings } from '@sunsteel/contracts'

/**
 * Links into one part of Settings (TD-55). The page scrolls inside `<main>`
 * and its cards mount only once the profile has loaded, so the browser's own
 * jump to a fragment finds nothing; `useScrollToHash` does it instead.
 */

/** How long the target is kept aligned while the cards above it load. */
export const HASH_ALIGN_WINDOW_MS = 3000

/** The element id a location hash names, or null when it names nothing. */
export function hashTargetId(hash: string): string | null {
	const raw = hash.startsWith('#') ? hash.slice(1) : hash
	if (!raw) return null
	try {
		return decodeURIComponent(raw)
	} catch {
		return null
	}
}

/**
 * A control is brought to the middle of the screen and focused, so its label
 * and the rows around it stay visible; a section is brought to the top.
 */
export function hashTargetPlacement(tagName: string): 'control' | 'section' {
	return ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(
		tagName.toUpperCase(),
	)
		? 'control'
		: 'section'
}

/** The one select in Settings that decides who sees a profile section. */
export function privacySettingHref(
	section: keyof ProfilePrivacySettings,
): string {
	return `/settings#privacy-${section}`
}
