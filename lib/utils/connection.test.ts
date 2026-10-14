import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	type ConnectionFacts,
	connectionLine,
	connectionNotice,
	leavingLosesChanges,
} from './connection'
import { saveStateLabel } from './save-status-store'

const en = translatorFor('en', 'shell.connection')
const es = translatorFor('es', 'shell.connection')

const facts = (overrides: Partial<ConnectionFacts> = {}): ConnectionFacts => ({
	online: true,
	waiting: 0,
	running: 0,
	reconnect: null,
	...overrides,
})

describe('TRUST-03 what the shell says about the connection', () => {
	it('says nothing while online and nothing has dropped', () => {
		expect(connectionNotice(facts())).toBeNull()
		expect(connectionNotice(facts({ running: 2 }))).toBeNull()
	})

	it('says it is offline, and how many changes wait in this page', () => {
		expect(connectionNotice(facts({ online: false }))).toEqual({
			kind: 'offline',
			waiting: 0,
		})
		expect(connectionNotice(facts({ online: false, waiting: 3 }))).toEqual({
			kind: 'offline',
			waiting: 3,
		})
	})

	it('reports a reconnect only when something waited for it', () => {
		const back = { hadWaiting: false, failed: 0 }
		expect(connectionNotice(facts({ reconnect: back }))).toBeNull()
	})

	it('is sending while anything that waited is still on its way', () => {
		const back = { hadWaiting: true, failed: 0 }
		expect(
			connectionNotice(facts({ reconnect: back, waiting: 1, running: 1 })),
		).toEqual({ kind: 'sending', waiting: 2 })
	})

	it('says saved only when nothing failed, and how many failed otherwise', () => {
		expect(
			connectionNotice(facts({ reconnect: { hadWaiting: true, failed: 0 } })),
		).toEqual({ kind: 'sent' })
		expect(
			connectionNotice(facts({ reconnect: { hadWaiting: true, failed: 2 } })),
		).toEqual({ kind: 'failed', failed: 2 })
	})

	it('promises a save on reconnect only while the page stays open', () => {
		const line = connectionLine({ kind: 'offline', waiting: 2 }, en)
		expect(line).toBe(
			"You're offline. 2 changes are waiting and will save when you reconnect. Keep this page open.",
		)
		expect(connectionLine({ kind: 'offline', waiting: 1 }, en)).toContain(
			'1 change is waiting',
		)
		expect(connectionLine({ kind: 'offline', waiting: 0 }, en)).toBe(
			"You're offline. Changes you make will wait here until you reconnect.",
		)
	})

	it('says each state in Spanish, with its plural', () => {
		expect(connectionLine({ kind: 'offline', waiting: 1 }, es)).toBe(
			'No tienes conexión. 1 cambio espera y se guardará al reconectarte: mantén esta página abierta.',
		)
		expect(connectionLine({ kind: 'offline', waiting: 3 }, es)).toContain(
			'3 cambios esperan y se guardarán',
		)
		expect(connectionLine({ kind: 'sending', waiting: 2 }, es)).toBe(
			'Conexión recuperada. Guardando 2 cambios…',
		)
		expect(connectionLine({ kind: 'sent' }, es)).toBe(
			'Conexión recuperada. Tus cambios están guardados.',
		)
		expect(connectionLine({ kind: 'failed', failed: 1 }, es)).toContain(
			'1 cambio no se guardó',
		)
	})

	it('asks before leaving only while changes wait', () => {
		expect(leavingLosesChanges(0)).toBe(false)
		expect(leavingLosesChanges(1)).toBe(true)
	})

	it('names a write waiting for the connection, not saving, in both languages', () => {
		expect(
			saveStateLabel('waiting', translatorFor('en', 'core.saveStatus')),
		).toBe('Waiting for connection')
		expect(
			saveStateLabel('waiting', translatorFor('es', 'core.saveStatus')),
		).toBe('Esperando conexión')
		expect(
			saveStateLabel('saving', translatorFor('en', 'core.saveStatus')),
		).toBe('Saving…')
	})
})
