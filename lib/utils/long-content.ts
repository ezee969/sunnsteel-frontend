/**
 * The long-content patterns every page shares (UX-01, design system §20):
 * a collapsible section, a bounded list and an explanation on demand. The
 * decisions live here so each page applies them the same way.
 */

/** A section's open or closed choice is stored per device under this prefix. */
export const COLLAPSE_STORAGE_PREFIX = 'ss-open:'

/** Fired on `window` when a stored choice changes in this tab. */
export const COLLAPSE_CHANGE_EVENT = 'ss-open-change'

/**
 * Where a section with `defaultOpen: 'wide'` starts open. It is `md`, the
 * width at which the protected shell gains its sidebar (§10).
 */
export const WIDE_QUERY = '(min-width: 768px)'

/** Open everywhere, closed everywhere, or open only from `md`. */
export type DefaultOpen = boolean | 'wide'

export function collapseStorageKey(id: string): string {
	return `${COLLAPSE_STORAGE_PREFIX}${id}`
}

/** A stored choice, or null when nothing (or nothing readable) is stored. */
export function parseStoredOpen(raw: string | null): boolean | null {
	if (raw === '1') return true
	if (raw === '0') return false
	return null
}

export function serializeOpen(open: boolean): '1' | '0' {
	return open ? '1' : '0'
}

/** The member's own choice wins; otherwise the section's default applies. */
export function resolveOpen(
	stored: boolean | null,
	defaultOpen: DefaultOpen,
	isWide: boolean,
): boolean {
	if (stored !== null) return stored
	return defaultOpen === 'wide' ? isWide : defaultOpen
}

/** The rows a bounded list shows: the first `limit` until it is expanded. */
export function visibleRows<T>(
	items: readonly T[],
	limit: number,
	expanded: boolean,
): readonly T[] {
	return expanded || items.length <= limit ? items : items.slice(0, limit)
}

/**
 * The control under a bounded list, or null when every row already fits. It
 * always names how many rows it reveals, so nothing is hidden without a count.
 */
export function showMoreLabel(
	total: number,
	limit: number,
	expanded: boolean,
): string | null {
	if (total <= limit) return null
	if (expanded) return 'Show fewer'
	return `Show ${total - limit} more`
}
