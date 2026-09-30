import {
	API_ERROR_CODES,
	API_ERROR_MESSAGES,
	apiErrorMessage as serverMessage,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'
import { HttpError } from '@/lib/api/services/httpClient'
import { MESSAGES } from '@/messages'

import { apiErrorMessage } from './api-errors'

const en = translatorFor('en', 'core.apiErrors')
const es = translatorFor('es', 'core.apiErrors')

const refusal = (
	code: string,
	params?: Record<string, string | number>,
	message = 'server English',
) => new HttpError(message, 409, code, params)

describe('I18N-06 API refusals', () => {
	it('holds every code, in English exactly as the server writes it', () => {
		const english = MESSAGES.en.core.apiErrors as Record<string, string>
		expect(Object.keys(english).sort()).toEqual([...API_ERROR_CODES].sort())
		for (const code of API_ERROR_CODES) {
			expect(english[code]).toBe(API_ERROR_MESSAGES[code])
		}
	})

	it('renders the same English the server sends, values included', () => {
		const params = { name: 'Peak', endDate: '2026-10-05' }
		expect(apiErrorMessage(refusal('SESSION_BLOCK_IN_FORCE', params), en)).toBe(
			serverMessage('SESSION_BLOCK_IN_FORCE', params),
		)
		expect(apiErrorMessage(refusal('ROUTINE_DAYS_MAX', { max: 7 }), en)).toBe(
			'A routine has at most 7 days',
		)
	})

	it('says a refusal in Spanish', () => {
		expect(apiErrorMessage(refusal('ROUTINE_NOT_FOUND'), es)).toBe(
			'No se encontró la rutina',
		)
		expect(
			apiErrorMessage(
				refusal('SESSION_DELOAD_IN_FORCE', { endDate: '2026-10-05' }),
				es,
			),
		).toBe(
			'Esta rutina está en descarga hasta el 2026-10-05; empieza uno de sus días',
		)
	})

	it('never groups a number, so a limit reads as the server wrote it', () => {
		expect(
			apiErrorMessage(refusal('CORRECTION_WEIGHT_RANGE', { max: 1000 }), en),
		).toBe('Weight must be between 0 and 1000 kg')
		expect(
			apiErrorMessage(refusal('CORRECTION_WEIGHT_RANGE', { max: 1000 }), es),
		).toBe('El peso debe estar entre 0 y 1000 kg')
	})

	it("keeps the server's sentence when a value it names is missing", () => {
		expect(
			apiErrorMessage(
				refusal('ROUTINE_DAYS_MAX', {}, 'A routine has at most 7 days'),
				es,
			),
		).toBe('A routine has at most 7 days')
	})

	it("falls back to the server's message for a code it does not know", () => {
		expect(
			apiErrorMessage(refusal('A_CODE_FROM_A_NEWER_SERVER', {}, 'Newer'), es),
		).toBe('Newer')
	})

	it('keeps the message of an uncoded or client-side error', () => {
		expect(apiErrorMessage(new HttpError('Invalid cursor', 400), es)).toBe(
			'Invalid cursor',
		)
		expect(apiErrorMessage(new Error('Offline'), es)).toBe('Offline')
		expect(apiErrorMessage(undefined, es, 'Inténtalo de nuevo')).toBe(
			'Inténtalo de nuevo',
		)
	})
})
