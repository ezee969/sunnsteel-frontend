import { hashTargetId } from './settings-anchor'

/**
 * Page tabs (UX-10, design system §21): a page split into a few route tabs.
 * These rules are the component's only decisions, kept pure so they are
 * tested.
 */
export interface PageTab {
	/** A path, optionally with a query (`/activity?view=yours`). */
	href: string
	label: string
	/** Shown beside the label, such as a relationship count. */
	count?: number
}

function parseHref(href: string): { path: string; params: URLSearchParams } {
	const [path, query = ''] = href.split('?')
	return { path, params: new URLSearchParams(query) }
}

/**
 * The tab the location is on: the path must be equal and every query
 * parameter the tab names must match. The most specific match wins, so
 * `/activity` holds the page unless `?view=yours` names the other tab.
 */
export function activeTabHref(
	tabs: readonly Pick<PageTab, 'href'>[],
	pathname: string,
	search: string | URLSearchParams = '',
): string | null {
	const current =
		typeof search === 'string'
			? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
			: search
	let best: { href: string; specificity: number } | null = null
	for (const tab of tabs) {
		const { path, params } = parseHref(tab.href)
		if (path !== pathname) continue
		let matches = true
		let specificity = 0
		params.forEach((value, key) => {
			specificity += 1
			if (current.get(key) !== value) matches = false
		})
		if (matches && (!best || specificity > best.specificity)) {
			best = { href: tab.href, specificity }
		}
	}
	return best?.href ?? null
}

/** Where an element that moved to another tab now lives. */
export type HashRule =
	{ id: string; href: string } | { prefix: string; href: string }

/**
 * The tab an old `#id` link should be sent to, or null when the element is
 * still on this tab or is unknown. Exact ids are checked before prefixes,
 * so a named card can live somewhere its prefix family does not.
 */
export function tabForHash(
	hash: string,
	rules: readonly HashRule[],
): string | null {
	const id = hashTargetId(hash)
	if (!id) return null
	for (const rule of rules) {
		if ('id' in rule && rule.id === id) return rule.href
	}
	for (const rule of rules) {
		if ('prefix' in rule && id.startsWith(rule.prefix)) return rule.href
	}
	return null
}
