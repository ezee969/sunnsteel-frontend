import {
	RESERVED_USERNAMES,
	USERNAME_MAX_LENGTH,
	USERNAME_MIN_LENGTH,
	USERNAME_PATTERN_SOURCE,
} from '@sunsteel/contracts'

import type { Translator } from '@/i18n/translator'

const USERNAME_PATTERN = new RegExp(USERNAME_PATTERN_SOURCE)
const RESERVED_USERNAME_SET = new Set<string>(RESERVED_USERNAMES)

export const normalizeUsername = (value: string) =>
	value.trim().replace(/^@/, '').toLowerCase()

export const getUsernameValidationError = (
	value: string,
	t: Translator<'settings.username'>,
): string | null => {
	const username = normalizeUsername(value)
	if (
		username.length < USERNAME_MIN_LENGTH ||
		username.length > USERNAME_MAX_LENGTH ||
		!USERNAME_PATTERN.test(username)
	) {
		return t('invalid')
	}
	if (RESERVED_USERNAME_SET.has(username)) {
		return t('reserved')
	}
	return null
}
