import { findRoutineTemplate } from '@/lib/utils/routine-templates'

/**
 * SITE-01 §12.8 and §12.10: what a visitor chose on the landing, carried
 * through sign-up. "Start with this one" sends `/signup?template=<slug>`,
 * "Try Pro free" `/signup?plan=pro`. Sign-up accepts only a template the app
 * knows and only `pro`, keeps the choice on the device for a day (email
 * confirmation can open in another tab) and passes it on as the address
 * email confirmation and Google sign-in come back to: onboarding, which
 * offers the chosen template first and, for Pro, ends on `/plans`. Nothing
 * here charges or starts a subscription -- the member still subscribes on
 * `/plans` and authorizes on Mercado Pago's page.
 */
export const SITE_HANDOFF_KEY = 'ss-site-handoff'
export const SITE_HANDOFF_TTL_MS = 24 * 60 * 60 * 1000

export interface SiteHandoff {
	/** A starter template's slug, known to `ROUTINE_TEMPLATES`. */
	template: string | null
	/** The visitor asked to try Pro. */
	pro: boolean
}

export const NO_HANDOFF: SiteHandoff = { template: null, pro: false }

export const hasHandoff = (handoff: SiteHandoff) =>
	handoff.template !== null || handoff.pro

/** Reads the address's choice, keeping only what the app knows. */
export function parseHandoff(params: {
	get(name: string): string | null
}): SiteHandoff {
	const slug = params.get('template')
	return {
		template: findRoutineTemplate(slug)?.slug ?? null,
		pro: params.get('plan') === 'pro',
	}
}

/** The choice as stored on the device, with when it was made. */
export function serializeHandoff(handoff: SiteHandoff, now: number): string {
	return JSON.stringify({ ...handoff, at: now })
}

/** A stored choice younger than a day, re-checked; anything else is none. */
export function readStoredHandoff(
	raw: string | null,
	now: number,
): SiteHandoff {
	if (!raw) return NO_HANDOFF
	try {
		const value: unknown = JSON.parse(raw)
		if (typeof value !== 'object' || value === null) return NO_HANDOFF
		const { template, pro, at } = value as Record<string, unknown>
		if (typeof at !== 'number' || now - at > SITE_HANDOFF_TTL_MS || at > now)
			return NO_HANDOFF
		return {
			template:
				typeof template === 'string'
					? (findRoutineTemplate(template)?.slug ?? null)
					: null,
			pro: pro === true,
		}
	} catch {
		return NO_HANDOFF
	}
}

/** The choice as a query string, empty when there is none. */
export function handoffQuery(handoff: SiteHandoff): string {
	const query = new URLSearchParams()
	if (handoff.template) query.set('template', handoff.template)
	if (handoff.pro) query.set('plan', 'pro')
	const text = query.toString()
	return text ? `?${text}` : ''
}

/** Where sign-up comes back to: onboarding with the choice, else the default. */
export function afterSignupPath(handoff: SiteHandoff): string {
	return hasHandoff(handoff) ? `/welcome${handoffQuery(handoff)}` : '/dashboard'
}

/**
 * A visitor already signed in who follows a landing link to sign-up goes
 * where the link meant: the builder on that template, else `/plans` for Pro,
 * else the dashboard. A template comes first: the trial is best spent with a
 * routine.
 */
export function signedInSignupTarget(params: {
	get(name: string): string | null
}): string {
	const handoff = parseHandoff(params)
	if (handoff.template) return `/routines/new?template=${handoff.template}`
	if (handoff.pro) return '/plans'
	return '/dashboard'
}

/** Where onboarding sends a member when it ends without opening the builder. */
export function afterOnboardingPath(handoff: SiteHandoff): string {
	return handoff.pro ? '/plans' : '/dashboard'
}

/** The device's copy, read and written defensively: storage can throw. */
export function loadHandoff(): SiteHandoff {
	try {
		return readStoredHandoff(
			window.localStorage.getItem(SITE_HANDOFF_KEY),
			Date.now(),
		)
	} catch {
		return NO_HANDOFF
	}
}

export function saveHandoff(handoff: SiteHandoff) {
	try {
		if (hasHandoff(handoff)) {
			window.localStorage.setItem(
				SITE_HANDOFF_KEY,
				serializeHandoff(handoff, Date.now()),
			)
		}
	} catch {
		// Blocked storage: the address still carries the choice.
	}
}

export function clearHandoff(part?: 'template' | 'pro') {
	try {
		if (!part) {
			window.localStorage.removeItem(SITE_HANDOFF_KEY)
			return
		}
		const current = loadHandoff()
		const next =
			part === 'template'
				? { ...current, template: null }
				: { ...current, pro: false }
		if (hasHandoff(next)) saveHandoff(next)
		else window.localStorage.removeItem(SITE_HANDOFF_KEY)
	} catch {
		// Nothing to forget where nothing could be stored.
	}
}
