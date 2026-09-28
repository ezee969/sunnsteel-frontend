/**
 * A11Y-02: two per-device display preferences, stored and applied the way
 * A11Y-01's reduced motion is (design system §22).
 *
 * - **Higher contrast** re-values the text, rule, mark and focus tokens. Like
 *   reduced motion it can only add: the OS `prefers-contrast: more` turns it on
 *   too, and the device choice never turns that off.
 * - **Larger controls** grows buttons, fields and checkboxes app-wide, and on
 *   the live session screen it is LIVE-18's gym mode.
 */
export type ContrastPreference = 'system' | 'more'
export type ControlSizePreference = 'standard' | 'large'

export const CONTRAST_PREFERENCE_STORAGE_KEY = 'ss-contrast'
export const CONTROL_SIZE_STORAGE_KEY = 'ss-controls'
/** Set on <html> as `data-contrast="more"`; `globals.css` mirrors the media query. */
export const CONTRAST_ATTRIBUTE = 'data-contrast'
/** Set on <html> as `data-controls="large"`; read by the `large-controls:` variant. */
export const CONTROL_SIZE_ATTRIBUTE = 'data-controls'
export const DISPLAY_PREFERENCE_EVENT = 'ss-display-change'

export function parseContrastPreference(
	raw: string | null | undefined,
): ContrastPreference {
	return raw === 'more' ? 'more' : 'system'
}

export function parseControlSizePreference(
	raw: string | null | undefined,
): ControlSizePreference {
	return raw === 'large' ? 'large' : 'standard'
}

export function resolveHigherContrast(
	preference: ContrastPreference,
	systemPrefersMore: boolean,
): boolean {
	return preference === 'more' || systemPrefersMore
}

/**
 * Runs in <head> before first paint, beside the motion script, so a stored
 * choice never flashes one frame of the standard display. Dependency-free,
 * and it swallows storage errors.
 */
export const DISPLAY_PREFERENCE_SCRIPT = `try{var d=document.documentElement;if(localStorage.getItem('${CONTRAST_PREFERENCE_STORAGE_KEY}')==='more')d.setAttribute('${CONTRAST_ATTRIBUTE}','more');if(localStorage.getItem('${CONTROL_SIZE_STORAGE_KEY}')==='large')d.setAttribute('${CONTROL_SIZE_ATTRIBUTE}','large')}catch(e){}`
