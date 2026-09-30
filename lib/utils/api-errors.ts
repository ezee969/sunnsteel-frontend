import {
	API_ERROR_MESSAGES,
	type ApiErrorCode,
	isApiErrorCode,
} from '@sunsteel/contracts'

import type { MessageKey, Translator } from '@/i18n/translator'
import { HttpError } from '@/lib/api/services/httpClient'

type ApiErrorKey = MessageKey<'core.apiErrors'>

/** Every contracts code is a key of `core.apiErrors`, or this stops compiling. */
const asKey = (code: ApiErrorCode): ApiErrorKey => code satisfies ApiErrorKey

/** The values a code's sentence names; both languages name the same ones. */
const placeholders = (code: ApiErrorCode) =>
	[...API_ERROR_MESSAGES[code].matchAll(/\{(\w+)\}/g)].map(match => match[1])

/**
 * I18N-06: the sentence to show for a failed request, in the member's
 * language. A refusal the server coded is translated, with the values it
 * names passed through as sent; anything else -- an unknown code from a newer
 * server, a network failure, a client-side error -- keeps its own message,
 * and `fallback` covers an error with none.
 *
 * Values are passed as strings on purpose: ICU would format a number in the
 * reader's locale (`1,000`), and the English must read exactly as the server
 * wrote it.
 */
export function apiErrorMessage(
	error: unknown,
	t: Translator<'core.apiErrors'>,
	fallback = '',
): string {
	if (error instanceof HttpError && isApiErrorCode(error.code)) {
		const values = Object.fromEntries(
			Object.entries(error.params ?? {}).map(([name, value]) => [
				name,
				String(value),
			]),
		)
		// A sentence missing one of its values reads better as the server's:
		// the translator would print its key instead.
		if (placeholders(error.code).every(name => name in values)) {
			return t(asKey(error.code), values)
		}
	}
	if (error instanceof Error && error.message) return error.message
	if (typeof error === 'string' && error) return error
	return fallback
}
