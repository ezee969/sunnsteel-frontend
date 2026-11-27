/**
 * UX-27 (design system §34): in the app, controls do not select and content
 * does. app/styles/selection.css makes a control's own text unselectable, but
 * Chromium still answers a double- or triple-click on one by selecting the
 * nearest selectable word, which is usually the next line of content (the
 * schedule's legend, after a double-click on Next month). Cancelling the
 * browser's default for the second and third press of a multi-click on a
 * control stops that, and the click itself still fires.
 */

/** Every control, as app/styles/selection.css names them (a test holds the two equal). */
export const CONTROL_SELECTORS = [
	'button',
	'summary',
	'label',
	"[role='button']",
	"[role='tab']",
	"[role='option']",
	"[role='menuitem']",
	"[role='menuitemcheckbox']",
	"[role='menuitemradio']",
	"[role='checkbox']",
	"[role='radio']",
	"[role='switch']",
	"[data-slot='button']",
	"[data-clickable='true']",
] as const

/** Fields, which are typed in and whose value is selected, even inside a control. */
export const FIELD_SELECTORS = [
	'input',
	'textarea',
	'select',
	"[contenteditable]:not([contenteditable='false'])",
] as const

/** What is drawn as part of a control and takes `select-none` where it is written. */
const DRAWN_AS_CONTROL = '.select-none'
/** A control whose text must be copied opts back in at its call site. */
const OPTED_IN = '.select-text'

const CONTROL = [...CONTROL_SELECTORS, DRAWN_AS_CONTROL].join(', ')
const KEEPS_SELECTION = [...FIELD_SELECTORS, OPTED_IN].join(', ')

type Closest = { closest(selectors: string): unknown }

function canFindAncestors(target: unknown): target is Closest {
	return (
		typeof target === 'object' &&
		target !== null &&
		typeof (target as Partial<Closest>).closest === 'function'
	)
}

/**
 * Whether a `mousedown` should not start a selection: the second or later
 * press of a multi-click (`detail`), on a control or inside one, never on a
 * field or on text a call site opted back in.
 */
export function cancelsMultiClickSelection(
	target: EventTarget | null,
	detail: number,
): boolean {
	if (detail < 2 || !canFindAncestors(target)) return false
	if (target.closest(KEEPS_SELECTION)) return false
	return Boolean(target.closest(CONTROL))
}
