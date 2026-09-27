import type { HashRule, PageTab } from './page-tabs'

/**
 * UX-12: Settings in five tabs, grouped by what someone comes to change.
 * Profile is the bare route, so the header, the sidebar and every other
 * plain `/settings` link still open the profile form.
 */
export const SETTINGS_TABS = [
	{ href: '/settings', label: 'Profile' },
	{ href: '/settings/training', label: 'Training' },
	{ href: '/settings/privacy', label: 'Privacy' },
	{ href: '/settings/notifications', label: 'Notifications' },
	{ href: '/settings/account', label: 'Account' },
] as const satisfies readonly PageTab[]

export const SETTINGS_TRAINING_HREF = '/settings/training'
export const SETTINGS_PRIVACY_HREF = '/settings/privacy'

/**
 * Where each card that left the single Settings page now lives, by the id an
 * old `/settings#…` link names (design system §21.4). The prefixes are the
 * per-row controls: `privacy-<section>` and `discovery-<kind>` selects, and
 * the training-location and goal fields.
 */
export const SETTINGS_HASH_RULES: readonly HashRule[] = [
	{ id: 'profile-privacy', href: SETTINGS_PRIVACY_HREF },
	{ id: 'activity-sharing', href: SETTINGS_PRIVACY_HREF },
	{ id: 'training-partners', href: SETTINGS_PRIVACY_HREF },
	{ id: 'quiet-hours', href: '/settings/notifications' },
	{ id: 'download-data', href: '/settings/account' },
	{ prefix: 'privacy-', href: SETTINGS_PRIVACY_HREF },
	{ prefix: 'discovery-', href: SETTINGS_PRIVACY_HREF },
	{ prefix: 'location-', href: SETTINGS_TRAINING_HREF },
	{ prefix: 'bar-', href: SETTINGS_TRAINING_HREF },
	{ prefix: 'equipment-', href: SETTINGS_TRAINING_HREF },
	{ prefix: 'plate-', href: SETTINGS_TRAINING_HREF },
	{ prefix: 'goal-', href: SETTINGS_TRAINING_HREF },
]
