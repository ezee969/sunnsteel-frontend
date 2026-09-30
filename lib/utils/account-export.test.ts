import type { AccountExportV1 } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import { accountExportFile } from './account-export'

const exported = {
	format: 'sunnsteel-account-export',
	formatVersion: 1,
	exportedAt: '2026-09-23T11:05:00.000Z',
	account: { username: 'athena' },
	routines: [],
} as unknown as AccountExportV1

describe('EXPORT-01 account export file', () => {
	it('names the file after the member and the day it was exported', () => {
		expect(accountExportFile(exported).fileName).toBe(
			'sunnsteel-athena-2026-09-23.json',
		)
	})

	it('writes the document unchanged, as readable JSON', () => {
		const { contents } = accountExportFile(exported)
		expect(JSON.parse(contents)).toEqual(exported)
		expect(contents).toContain('\n  "format": "sunnsteel-account-export"')
	})

	it('says what the file holds and what it leaves out, in plain terms', () => {
		const t = translatorFor('en', 'settings.accountExport')
		expect(t('contents')).toMatch(/every workout with its sets/)
		expect(t('notes')).toMatch(/kilograms/)
		expect(t('notes')).toMatch(/username only/)
	})

	it('says the same in Spanish', () => {
		const t = translatorFor('es', 'settings.accountExport')
		expect(t('contents')).toMatch(/cada entrenamiento con sus series/)
		expect(t('notes')).toMatch(/kilogramos/)
		expect(t('notes')).toMatch(/solo por su nombre de usuario/)
	})
})
