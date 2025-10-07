/**
 * Centralized validation constants
 * These should match Supabase configuration and backend validation
 */

export const VALIDATION_RULES = {
	// Password validation
	PASSWORD_MIN_LENGTH: 6,
	PASSWORD_MAX_LENGTH: 128,

	// Name validation
	NAME_MIN_LENGTH: 2,
	NAME_MAX_LENGTH: 100,

	// Email validation (using standard email regex)
	EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const

export const VALIDATION_MESSAGES = {
	// Password messages
	PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`,
	PASSWORD_TOO_LONG: `Password must not exceed ${VALIDATION_RULES.PASSWORD_MAX_LENGTH} characters`,
	PASSWORD_REQUIRED: 'Password is required',

	// Name messages
	NAME_TOO_SHORT: `Name must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters`,
	NAME_TOO_LONG: `Name must not exceed ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`,
	NAME_REQUIRED: 'Name is required',

	// Email messages
	EMAIL_INVALID: 'Please enter a valid email address',
	EMAIL_REQUIRED: 'Email is required',

	// Password confirmation
	PASSWORDS_DONT_MATCH: "Passwords don't match",
} as const
