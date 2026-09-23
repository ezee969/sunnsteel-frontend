import type { AccountExportV1 } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	ACCOUNT_EXPORT_CONTENTS,
	ACCOUNT_EXPORT_NOTES,
	accountExportFile,
} from './account-export'

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
		expect(ACCOUNT_EXPORT_CONTENTS).toMatch(/every workout with its sets/)
		expect(ACCOUNT_EXPORT_NOTES).toMatch(/kilograms/)
		expect(ACCOUNT_EXPORT_NOTES).toMatch(/username only/)
	})
})
