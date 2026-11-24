import type { Locale } from '@/i18n/config'

import enAchievements from './en/achievements.json'
import enBilling from './en/billing.json'
import enCatalog from './en/catalog.json'
import enCore from './en/core.json'
import enMessaging from './en/messaging.json'
import enOnboarding from './en/onboarding.json'
import enPlanning from './en/planning.json'
import enProgress from './en/progress.json'
import enRoutines from './en/routines.json'
import enSettings from './en/settings.json'
import enShell from './en/shell.json'
import enSite from './en/site.json'
import enSitePages from './en/sitePages.json'
import enSocial from './en/social.json'
import enWorkout from './en/workout.json'
import esAchievements from './es/achievements.json'
import esBilling from './es/billing.json'
import esCatalog from './es/catalog.json'
import esCore from './es/core.json'
import esMessaging from './es/messaging.json'
import esOnboarding from './es/onboarding.json'
import esPlanning from './es/planning.json'
import esProgress from './es/progress.json'
import esRoutines from './es/routines.json'
import esSettings from './es/settings.json'
import esShell from './es/shell.json'
import esSite from './es/site.json'
import esSitePages from './es/sitePages.json'
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
	onboarding: enOnboarding,
	messaging: enMessaging,
	billing: enBilling,
	site: enSite,
	sitePages: enSitePages,
}

export type Messages = typeof en

/**
 * SITE-01: the public pages' copy is read on the server only, so it is left
 * out of what the layout hands the browser on every page.
 */
export type ClientMessages = Omit<Messages, 'sitePages'>
export function clientMessages(messages: Messages): ClientMessages {
	const client: Partial<Messages> = { ...messages }
	delete client.sitePages
	return client as ClientMessages
}

/**
 * SITE-01: what the root layout hands the browser on every page -- only
 * `core`, which the root error boundary and the toasts read. Each app route
 * group adds the rest (`AppMessages`), and the public site its own areas
 * (`siteMessages`), so the landing no longer carries the app's whole
 * vocabulary (Lighthouse, 2026-11-24: about 270 KB of it, on every visit).
 */
export type RootMessages = Pick<Messages, 'core'>
export function rootMessages(messages: Messages): RootMessages {
	return { core: messages.core }
}

/**
 * The public site's client components read `site`, the body map's labels
 * (`progress.bodyMap`, `routines.muscles`) and, through the root error
 * boundary, `core`; nothing else reaches the browser on a site page.
 */
export type SiteMessages = Pick<Messages, 'core' | 'site'> & {
	progress: Pick<Messages['progress'], 'bodyMap'>
	routines: Pick<Messages['routines'], 'muscles'>
}
export function siteMessages(messages: Messages): SiteMessages {
	return {
		core: messages.core,
		site: messages.site,
		progress: { bodyMap: messages.progress.bodyMap },
		routines: { muscles: messages.routines.muscles },
	}
}

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
		onboarding: esOnboarding,
		messaging: esMessaging,
		billing: esBilling,
		site: esSite,
		sitePages: esSitePages,
	},
}
