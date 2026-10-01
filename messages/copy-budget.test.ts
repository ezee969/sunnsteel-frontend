import { IntlMessageFormat } from 'intl-messageformat'
import { describe, expect, it } from 'vitest'

import { LOCALES } from '@/i18n/config'

import { MESSAGES } from '.'

/**
 * UX-17 (design system §23.4): a section's visible description is one line on
 * a phone, about 90 characters in English and 110 in Spanish, with the rest
 * behind "How this works". These are the lines that stay visible, formatted
 * with the values a real page passes them, so a later edit cannot let one
 * grow back into a paragraph.
 */
const BUDGET = { en: 90, es: 110 } as const

const SUMMARIES: Record<string, Record<string, string | number>> = {
	'planning.plateaus.fallbackDescription': {},
	'progress.signals.introSummary': {
		recent: 'the last 14 days',
		previous: 'the 14 days before',
	},
	'progress.body.introSummary': {},
	'progress.muscles.noteSummary': {},
	'progress.volume.noteSummary': {},
	'routines.trainingBlocks.descriptionSummary': {},
	'routines.deloads.descriptionSummary': { days: 14 },
	'routines.discovery.scopeSummary': {},
	'routines.sharing.sharedNoteSummary': {},
	'settings.profileDiscovery.descriptionSummary': {},
	'settings.trainingPartners.descriptionSummary': {},
	'settings.trainingLocations.descriptionSummary': {},
	'settings.measurableGoals.descriptionSummary': {},
	'settings.featuredItems.descriptionSummary': { max: 6 },
	'settings.display.contrastNoteSummary': {},
	'settings.display.controlsNoteSummary': {},
	'settings.motion.reduceNoteSummary': {},
	'settings.pushNotifications.noteSummary': {},
	'settings.accountExport.notesSummary': {},
	'settings.notificationPreferences.partnerActivityNoteSummary': {},
	'social.activity.feedScopeSummary': {},
	'social.activity.defaultsSummary': {},
	'social.activityUi.yoursSummary': {},
	'catalog.exercisesUi.recentSummary': {},
}

type Tree = { [key: string]: string | Tree }

function message(locale: string, key: string): string {
	const found = key
		.split('.')
		.reduce<string | Tree | undefined>(
			(node, part) =>
				node && typeof node === 'object' ? node[part] : undefined,
			MESSAGES[locale as keyof typeof MESSAGES] as unknown as Tree,
		)
	if (typeof found !== 'string')
		throw new Error(`No ${locale} message at ${key}`)
	return found
}

/** The text a member reads: values filled in, rich-text tags kept as text. */
function rendered(locale: string, key: string): string {
	const tag = (chunks: unknown[]) => chunks.join('')
	const values = { ...SUMMARIES[key], link: tag, strong: tag }
	const out = new IntlMessageFormat(message(locale, key), locale).format(values)
	return (Array.isArray(out) ? out.join('') : String(out)).trim()
}

describe('copy budget (UX-17)', () => {
	for (const locale of LOCALES) {
		const budget = BUDGET[locale as keyof typeof BUDGET]
		it.each(Object.keys(SUMMARIES))(`${locale}: %s fits one line`, key => {
			expect(rendered(locale, key).length).toBeLessThanOrEqual(budget)
		})
	}
})
