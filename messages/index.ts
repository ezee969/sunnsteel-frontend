import type { Locale } from '@/i18n/config'

import enShell from './en/shell.json'
import enWorkout from './en/workout.json'
import esShell from './es/shell.json'
import esWorkout from './es/workout.json'

/**
 * I18N-01: one JSON file per area and language, joined here into the object
 * `next-intl` reads. English is the source: its shape is the type every other
 * language must match, and `messages.test.ts` fails when one does not.
 */
const en = {
	shell: enShell,
	workout: enWorkout,
}

export type Messages = typeof en

export const MESSAGES: Record<Locale, Messages> = {
	en,
	es: {
		shell: esShell,
		workout: esWorkout,
	},
}
