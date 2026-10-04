import type { Locale } from '@/i18n/config'
import { intlLocale } from '@/i18n/date-locale'

/**
 * PREF-04: the time zone choices, pure so they are tested. The account's zone
 * governs everything the server decides (analytics days, reminders, the plan
 * a date trains); screens keep this device's clock.
 */

/** This device's IANA zone, or null where the runtime cannot say. */
export function deviceTimeZone(): string | null {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null
	} catch {
		return null
	}
}

/** Every IANA zone the runtime knows, falling back to the ones in hand. */
export function knownTimeZones(...extra: Array<string | null | undefined>) {
	let zones: string[] = []
	try {
		zones =
			(
				Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
			).supportedValuesOf?.('timeZone') ?? []
	} catch {
		zones = []
	}
	const all = new Set(zones)
	for (const zone of extra) if (zone) all.add(zone)
	return [...all]
}

/** "Europe/Madrid" as "Europe / Madrid", with its offset now: "(GMT+2)". */
export function timeZoneLabel(
	zone: string,
	locale: Locale,
	now = new Date(),
): string {
	const place = zone.replace(/_/g, ' ').replace(/\//g, ' / ')
	try {
		const offset = new Intl.DateTimeFormat(intlLocale(locale), {
			timeZone: zone,
			timeZoneName: 'shortOffset',
		})
			.formatToParts(now)
			.find(part => part.type === 'timeZoneName')?.value
		return offset ? `${place} (${offset})` : place
	} catch {
		return place
	}
}

/**
 * The zones in the order the select shows them: this device's first, then
 * the account's when it is another, then the rest alphabetically.
 */
export function orderTimeZones(
	zones: readonly string[],
	account: string | null,
	device: string | null,
): string[] {
	const first = [device, account].filter(
		(zone, index, list): zone is string =>
			!!zone && list.indexOf(zone) === index,
	)
	const rest = zones
		.filter(zone => !first.includes(zone))
		.sort((a, b) => a.localeCompare(b))
	return [...first, ...rest]
}

/**
 * Whether this device keeps a different clock from the account. Two names of
 * one zone (an alias) are not a difference: both are compared as the runtime
 * resolves them.
 */
export function zonesDiffer(
	account: string | null | undefined,
	device: string | null,
): boolean {
	if (!account || !device) return false
	const canonical = (zone: string) => {
		try {
			return new Intl.DateTimeFormat('en', { timeZone: zone }).resolvedOptions()
				.timeZone
		} catch {
			return zone
		}
	}
	return canonical(account) !== canonical(device)
}
