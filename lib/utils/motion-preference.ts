/**
 * A11Y-01: a per-device "reduce motion" preference that behaves exactly like
 * the operating-system setting (motion spec §3). It can only add reduction;
 * it never re-enables motion the OS asked to reduce.
 */
export type MotionPreference = 'system' | 'reduce'

export const MOTION_PREFERENCE_STORAGE_KEY = 'ss-motion'
/** Set on <html> as `data-motion="reduce"`; `globals.css` mirrors the media block. */
export const MOTION_ATTRIBUTE = 'data-motion'
export const MOTION_PREFERENCE_EVENT = 'ss-motion-change'

export function parseMotionPreference(
	raw: string | null | undefined,
): MotionPreference {
	return raw === 'reduce' ? 'reduce' : 'system'
}

export function resolveReducedMotion(
	preference: MotionPreference,
	systemPrefersReduced: boolean,
): boolean {
	return preference === 'reduce' || systemPrefersReduced
}

/**
 * Runs in <head> before first paint so a stored preference never flashes one
 * frame of motion. It must stay dependency-free and swallow storage errors.
 */
export const MOTION_PREFERENCE_SCRIPT = `try{if(localStorage.getItem('${MOTION_PREFERENCE_STORAGE_KEY}')==='reduce')document.documentElement.setAttribute('${MOTION_ATTRIBUTE}','reduce')}catch(e){}`

/** Motion-token durations in seconds, for framer-motion (design system §9). */
const MOTION_FAST = 0.12

/**
 * Timing for the mobile splash. Full motion keeps its staggered opacity
 * entrance; reduced motion keeps the same content but lets it arrive in one
 * quick opacity step with nothing looping or growing.
 */
export function getSplashMotion(reduced: boolean) {
	return {
		fade: (delay: number, duration = 0.3) => ({
			duration: reduced ? MOTION_FAST : duration,
			delay: reduced ? 0 : delay,
		}),
		exitDuration: reduced ? MOTION_FAST : 0.5,
		contentFadeDuration: reduced ? MOTION_FAST : 0.5,
		/** The three waiting dots pulse forever; reduced motion holds them. */
		pulseDots: !reduced,
		/** The load bar grows in width; reduced motion shows it complete. */
		animateProgress: !reduced,
	}
}
