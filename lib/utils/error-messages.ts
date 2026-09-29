import type { Translator } from '@/i18n/translator'

/**
 * Maps raw Supabase error messages to user-friendly messages
 * with actionable guidance
 */

type ErrorMessageKey =
	| 'emailAlreadyRegistered'
	| 'invalidEmail'
	| 'weakPassword'
	| 'rateLimit'
	| 'emailNotVerified'
	| 'invalidCredentials'
	| 'networkError'
	| 'sessionExpired'
	| 'authFailed'

type ErrorMessageGuidanceKey = `${ErrorMessageKey}Guidance`

export interface ErrorMessageMapping {
	pattern: RegExp | string
	messageKey: ErrorMessageKey
	guidanceKey: ErrorMessageGuidanceKey
}

const errorMappings: ErrorMessageMapping[] = [
	// Email already in use
	{
		pattern:
			/user already registered|email.*already.*registered|duplicate.*email/i,
		messageKey: 'emailAlreadyRegistered',
		guidanceKey: 'emailAlreadyRegisteredGuidance',
	},
	// Invalid email format
	{
		pattern: /invalid.*email|email.*invalid/i,
		messageKey: 'invalidEmail',
		guidanceKey: 'invalidEmailGuidance',
	},
	// Weak password
	{
		pattern:
			/password.*too.*short|password.*at least.*6|password.*weak|password.*strength/i,
		messageKey: 'weakPassword',
		guidanceKey: 'weakPasswordGuidance',
	},
	// Rate limit exceeded
	{
		pattern: /rate.*limit|too.*many.*requests|email.*rate.*limit/i,
		messageKey: 'rateLimit',
		guidanceKey: 'rateLimitGuidance',
	},
	// Email not verified
	{
		pattern: /email.*not.*confirmed|email.*not.*verified/i,
		messageKey: 'emailNotVerified',
		guidanceKey: 'emailNotVerifiedGuidance',
	},
	// Invalid credentials (login)
	{
		pattern: /invalid.*credentials|invalid.*login|incorrect.*password/i,
		messageKey: 'invalidCredentials',
		guidanceKey: 'invalidCredentialsGuidance',
	},
	// Network errors
	{
		pattern: /network.*error|failed.*to.*fetch|fetch.*failed/i,
		messageKey: 'networkError',
		guidanceKey: 'networkErrorGuidance',
	},
	// Session expired
	{
		pattern: /session.*expired|token.*expired|jwt.*expired/i,
		messageKey: 'sessionExpired',
		guidanceKey: 'sessionExpiredGuidance',
	},
	// Generic authentication error
	{
		pattern: /authentication.*failed|auth.*error/i,
		messageKey: 'authFailed',
		guidanceKey: 'authFailedGuidance',
	},
]

/**
 * Converts a raw error message to a user-friendly message
 * @param errorMessage - The raw error message from Supabase or backend
 * @param t - `core.errorMessages` translator
 * @returns Friendly error message with optional guidance
 */
export function getFriendlyErrorMessage(
	errorMessage: string | undefined | null,
	t: Translator<'core.errorMessages'>,
): { message: string; guidance?: string } {
	if (!errorMessage) {
		return {
			message: t('unexpectedTitle'),
			guidance: t('unexpectedGuidance'),
		}
	}

	// Check each mapping for a match
	for (const mapping of errorMappings) {
		const matches =
			typeof mapping.pattern === 'string'
				? errorMessage.includes(mapping.pattern)
				: mapping.pattern.test(errorMessage)

		if (matches) {
			return {
				message: t(mapping.messageKey),
				guidance: t(mapping.guidanceKey),
			}
		}
	}

	// If no mapping found, return a sanitized version of the original message
	// Remove technical details like stack traces, UUIDs, etc.
	const sanitized = errorMessage
		.replace(
			/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
			'',
		) // Remove UUIDs
		.replace(/at\s+[\w.<>]+\s*\([^)]+\)/g, '') // Remove stack traces
		.replace(/\s{2,}/g, ' ') // Remove extra spaces
		.trim()

	return {
		message: sanitized || t('genericError'),
		guidance: t('unexpectedGuidance'),
	}
}

/**
 * Gets a concise error message without guidance
 */
export function getErrorMessage(
	errorMessage: string | undefined | null,
	t: Translator<'core.errorMessages'>,
): string {
	return getFriendlyErrorMessage(errorMessage, t).message
}

/**
 * Gets both message and guidance as a single formatted string
 */
export function getFullErrorMessage(
	errorMessage: string | undefined | null,
	t: Translator<'core.errorMessages'>,
): string {
	const { message, guidance } = getFriendlyErrorMessage(errorMessage, t)
	return guidance ? `${message}. ${guidance}` : message
}
