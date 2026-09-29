import type { Locale } from '@/i18n/config'

import enCatalog from './en/catalog.json'
import enRoutines from './en/routines.json'
import enShell from './en/shell.json'
import esCatalog from './es/catalog.json'
import esRoutines from './es/routines.json'
import esShell from './es/shell.json'

/**
 * I18N-01: one JSON file per area and language, joined here into the object
 * `next-intl` reads. English is the source: its shape is the type every other
 * language must match, and `messages.test.ts` fails when one does not.
 */
const en = {
	shell: enShell,
	catalog: enCatalog,
	routines: enRoutines,
}

export type Messages = typeof en

export const MESSAGES: Record<Locale, Messages> = {
	en,
	es: {
		shell: esShell,
		catalog: esCatalog,
		routines: esRoutines,
	},
}
