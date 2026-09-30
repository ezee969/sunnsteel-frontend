import type { Page } from '@playwright/test'

import { MESSAGES as APP_MESSAGES } from '../messages'
import { BASE_URL } from './preconditions'

/**
 * I18N: the language the sweep runs in. `UI_LOCALE=es npm run ui:regression`
 * sets the `ss-locale` cookie the middleware reads, so every page is the
 * Spanish build, and every accessible name the checks look for comes from the
 * same message files the app renders. English is the default and reads
 * exactly the names the sweep always used.
 */
export const UI_LOCALE: 'en' | 'es' =
	process.env.UI_LOCALE === 'es' ? 'es' : 'en'

type Messages = Record<string, unknown>
const MESSAGES = APP_MESSAGES as unknown as Record<'en' | 'es', Messages>

/** A message by its dotted key, `{name}` placeholders filled from `values`. */
export function msg(key: string, values: Record<string, string> = {}): string {
	const found = key
		.split('.')
		.reduce<unknown>(
			(node, part) =>
				node && typeof node === 'object' ? (node as Messages)[part] : undefined,
			MESSAGES[UI_LOCALE],
		)
	if (typeof found !== 'string') {
		throw new Error(`No ${UI_LOCALE} message at "${key}"`)
	}
	return found.replace(/\{(\w+)\}/g, (whole, name: string) =>
		name in values ? values[name] : whole,
	)
}

/** A message's text before its first placeholder, as an anchored pattern. */
export function msgPrefix(key: string): RegExp {
	const prefix = msg(key).split('{')[0]
	return new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
}

/** Puts the sweep's language on a page's context before it loads anything. */
export async function seedLocale(page: Page) {
	if (UI_LOCALE === 'en') return
	await page
		.context()
		.addCookies([{ name: 'ss-locale', value: UI_LOCALE, url: BASE_URL }])
}
