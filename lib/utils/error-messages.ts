/**
 * Maps raw Supabase error messages to user-friendly messages
 * with actionable guidance
 */

export interface ErrorMessageMapping {
	pattern: RegExp | string
	friendlyMessage: string
	actionableGuidance?: string
}

const errorMappings: ErrorMessageMapping[] = [
	// Email already in use
	{
		pattern: /user already registered|email.*already.*registered|duplicate.*email/i,
		friendlyMessage: 'This email is already registered',
		actionableGuidance:
			'If this is your account, try logging in instead. Forgot your password? Use the password reset option.',
	},
	// Invalid email format
	{
		pattern: /invalid.*email|email.*invalid/i,
		friendlyMessage: 'Invalid email address',
		actionableGuidance:
			'Please enter a valid email address (e.g., name@example.com)',
	},
	// Weak password
	{
		pattern:
			/password.*too.*short|password.*at least.*6|password.*weak|password.*strength/i,
		friendlyMessage: 'Password is too weak',
		actionableGuidance:
			'Password must be at least 6 characters long. Use a mix of letters, numbers, and symbols for better security.',
	},
	// Rate limit exceeded
	{
		pattern: /rate.*limit|too.*many.*requests|email.*rate.*limit/i,
		friendlyMessage: 'Too many attempts',
		actionableGuidance:
			'You have made too many requests. Please wait a few minutes and try again.',
	},
	// Email not verified
	{
		pattern: /email.*not.*confirmed|email.*not.*verified/i,
		friendlyMessage: 'Email not verified',
		actionableGuidance:
			'Please check your email and click the verification link before logging in.',
	},
	// Invalid credentials (login)
	{
		pattern: /invalid.*credentials|invalid.*login|incorrect.*password/i,
		friendlyMessage: 'Incorrect email or password',
		actionableGuidance:
			'Please check your credentials and try again. Passwords are case-sensitive.',
	},
	// Network errors
	{
		pattern: /network.*error|failed.*to.*fetch|fetch.*failed/i,
		friendlyMessage: 'Connection error',
		actionableGuidance:
			'Unable to connect to the server. Please check your internet connection and try again.',
	},
	// Session expired
	{
		pattern: /session.*expired|token.*expired|jwt.*expired/i,
		friendlyMessage: 'Session expired',
		actionableGuidance: 'Your session has expired. Please log in again.',
	},
	// Generic authentication error
	{
		pattern: /authentication.*failed|auth.*error/i,
		friendlyMessage: 'Authentication failed',
		actionableGuidance: 'Unable to authenticate. Please try again.',
	},
]

/**
 * Converts a raw error message to a user-friendly message
 * @param errorMessage - The raw error message from Supabase or backend
 * @returns Friendly error message with optional guidance
 */
export function getFriendlyErrorMessage(
	errorMessage: string | undefined | null,
): { message: string; guidance?: string } {
	if (!errorMessage) {
		return {
			message: 'An unexpected error occurred',
			guidance: 'Please try again. If the problem persists, contact support.',
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
				message: mapping.friendlyMessage,
				guidance: mapping.actionableGuidance,
			}
		}
	}

	// If no mapping found, return a sanitized version of the original message
	// Remove technical details like stack traces, UUIDs, etc.
	const sanitized = errorMessage
		.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '') // Remove UUIDs
		.replace(/at\s+[\w.<>]+\s*\([^)]+\)/g, '') // Remove stack traces
		.replace(/\s{2,}/g, ' ') // Remove extra spaces
		.trim()

	return {
		message: sanitized || 'An error occurred',
		guidance: 'Please try again. If the problem persists, contact support.',
	}
}

/**
 * Gets a concise error message without guidance
 */
export function getErrorMessage(
	errorMessage: string | undefined | null,
): string {
	return getFriendlyErrorMessage(errorMessage).message
}

/**
 * Gets both message and guidance as a single formatted string
 */
export function getFullErrorMessage(
	errorMessage: string | undefined | null,
): string {
	const { message, guidance } = getFriendlyErrorMessage(errorMessage)
	return guidance ? `${message}. ${guidance}` : message
}
