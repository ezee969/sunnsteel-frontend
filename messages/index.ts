import type { Locale } from '@/i18n/config'

import enCore from './en/core.json'
import enShell from './en/shell.json'
import esCore from './es/core.json'
import esShell from './es/shell.json'

/**
 * I18N-01: one JSON file per area and language, joined here into the object
 * `next-intl` reads. English is the source: its shape is the type every other
 * language must match, and `messages.test.ts` fails when one does not.
 */
const en = {
	core: enCore,
	shell: enShell,
}

export type Messages = typeof en

export const MESSAGES: Record<Locale, Messages> = {
	en,
	es: {
		core: esCore,
		shell: esShell,
	},
}
