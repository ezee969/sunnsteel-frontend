import type { MessageKey, Translator } from '@/i18n/translator'

import type { HashRule, PageTab } from './page-tabs'

/**
 * UX-12: Settings in five tabs, grouped by what someone comes to change.
 * Profile is the bare route, so the header, the sidebar and every other
 * plain `/settings` link still open the profile form.
 */
const SETTINGS_TAB_KEYS: {
	href: string
	key: MessageKey<'settings.tabs'>
}[] = [
	{ href: '/settings', key: 'profile' },
	{ href: '/settings/training', key: 'training' },
	{ href: '/settings/privacy', key: 'privacy' },
	{ href: '/settings/notifications', key: 'notifications' },
	{ href: '/settings/account', key: 'account' },
]

export function settingsTabs(
	t: Translator<'settings.tabs'>,
): readonly PageTab[] {
	return SETTINGS_TAB_KEYS.map(tab => ({ href: tab.href, label: t(tab.key) }))
}

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
