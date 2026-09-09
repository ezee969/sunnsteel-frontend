import {
	RESERVED_USERNAMES,
	USERNAME_MAX_LENGTH,
	USERNAME_MIN_LENGTH,
	USERNAME_PATTERN_SOURCE,
} from '@sunsteel/contracts'

const USERNAME_PATTERN = new RegExp(USERNAME_PATTERN_SOURCE)
const RESERVED_USERNAME_SET = new Set<string>(RESERVED_USERNAMES)

export const normalizeUsername = (value: string) =>
	value.trim().replace(/^@/, '').toLowerCase()

export const getUsernameValidationError = (value: string): string | null => {
	const username = normalizeUsername(value)
	if (
		username.length < USERNAME_MIN_LENGTH ||
		username.length > USERNAME_MAX_LENGTH ||
		!USERNAME_PATTERN.test(username)
	) {
		return 'Use 3–30 letters, numbers, underscores or hyphens, starting and ending with a letter or number.'
	}
	if (RESERVED_USERNAME_SET.has(username)) {
		return 'This username is reserved.'
	}
	return null
}
