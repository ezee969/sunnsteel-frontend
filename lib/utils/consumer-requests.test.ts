import { describe, expect, it } from 'vitest'

import {
	CONSUMER_REQUEST_PATHS,
	consumerRequestToSend,
	EMPTY_CONSUMER_REQUEST,
} from './consumer-requests'

describe('consumerRequestToSend', () => {
	it('sends what the server stores: trimmed, the email lowercased, empty optional fields left out', () => {
		const { request, problems } = consumerRequestToSend('REVOCATION', {
			name: '  Ana Pérez ',
			email: ' Ana@Example.com',
			reference: ' ',
			details: ' Pagué dos veces ',
		})
		expect(problems).toEqual([])
		expect(request).toEqual({
			kind: 'REVOCATION',
			name: 'Ana Pérez',
			email: 'ana@example.com',
			details: 'Pagué dos veces',
		})
	})

	it('names the fields the server would refuse', () => {
		expect(
			consumerRequestToSend('CANCELLATION', EMPTY_CONSUMER_REQUEST).problems,
		).toEqual(['name', 'email'])
		expect(
			consumerRequestToSend('CANCELLATION', {
				...EMPTY_CONSUMER_REQUEST,
				name: 'Ana',
				email: 'ana@example.com',
				reference: 'x'.repeat(101),
			}).problems,
		).toEqual(['reference'])
	})
})

describe('CONSUMER_REQUEST_PATHS', () => {
	it('puts each button at its own address', () => {
		expect(CONSUMER_REQUEST_PATHS).toEqual({
			REVOCATION: '/arrepentimiento',
			CANCELLATION: '/baja',
		})
	})
})
