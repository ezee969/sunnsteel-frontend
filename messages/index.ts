import type { Locale } from '@/i18n/config'

import enAchievements from './en/achievements.json'
import enCatalog from './en/catalog.json'
import enCore from './en/core.json'
import enPlanning from './en/planning.json'
import enProgress from './en/progress.json'
import enRoutines from './en/routines.json'
import enSettings from './en/settings.json'
import enShell from './en/shell.json'
import enSocial from './en/social.json'
import enWorkout from './en/workout.json'
import esAchievements from './es/achievements.json'
import esCatalog from './es/catalog.json'
import esCore from './es/core.json'
import esPlanning from './es/planning.json'
import esProgress from './es/progress.json'
import esRoutines from './es/routines.json'
import esSettings from './es/settings.json'
import esShell from './es/shell.json'
import esSocial from './es/social.json'
import esWorkout from './es/workout.json'

/**
 * I18N-01: one JSON file per area and language, joined here into the object
 * `next-intl` reads. English is the source: its shape is the type every other
 * language must match, and `messages.test.ts` fails when one does not.
 */
const en = {
	core: enCore,
	shell: enShell,
	workout: enWorkout,
	catalog: enCatalog,
	routines: enRoutines,
	planning: enPlanning,
	progress: enProgress,
	social: enSocial,
	settings: enSettings,
	achievements: enAchievements,
}

export type Messages = typeof en

export const MESSAGES: Record<Locale, Messages> = {
	en,
	es: {
		core: esCore,
		shell: esShell,
		workout: esWorkout,
		catalog: esCatalog,
		routines: esRoutines,
		planning: esPlanning,
		progress: esProgress,
		social: esSocial,
		settings: esSettings,
		achievements: esAchievements,
	},
}
