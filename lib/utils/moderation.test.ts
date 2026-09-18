import type { BlockedMember } from '@sunsteel/contracts'
import { REPORT_REASONS } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	BLOCK_EXPLANATION,
	BLOCK_LINK_CAVEAT,
	blockedMemberName,
	REPORT_REASON_LABELS,
	REPORT_REASON_OPTIONS,
	REPORT_RECEIPT,
	UNBLOCK_EXPLANATION,
} from './moderation'

const block = (
	overrides: Partial<BlockedMember['member']> = {},
): BlockedMember => ({
	member: {
		id: 'them',
		username: 'them',
		name: 'Them',
		lastName: null,
		avatarUrl: null,
		...overrides,
	},
	blockedAt: '2026-09-18T10:00:00.000Z',
})

describe('blocking copy', () => {
	it('says the block runs both ways and removes the follows', () => {
		// A control described as one-directional would leave the blocker
		// believing they are still visible to the person they blocked.
		expect(BLOCK_EXPLANATION).toMatch(/both ways/i)
		expect(BLOCK_EXPLANATION).toMatch(/follow/i)
	})

	it('states what a block cannot do, rather than implying it does', () => {
		// A SOC-07 or ROUT-04 link carries no viewer identity, so a block cannot
		// withdraw one; claiming otherwise would be a false safety promise.
		expect(BLOCK_LINK_CAVEAT).toMatch(/links/i)
		expect(BLOCK_LINK_CAVEAT).toMatch(/revoke/i)
	})

	it('warns that unblocking restores nothing it removed', () => {
		expect(UNBLOCK_EXPLANATION).toMatch(/not restored/i)
	})
})

describe('reporting copy', () => {
	it('confirms recording without promising a review or a timetable', () => {
		// TRUST-04 owns the queue and the enforcement; nothing reads these rows.
		expect(REPORT_RECEIPT).toMatch(/recorded/i)
		expect(REPORT_RECEIPT).not.toMatch(/within|24 hours|we will review it/i)
	})

	it('labels every reason the contract defines, in contract order', () => {
		for (const reason of REPORT_REASONS) {
			expect(REPORT_REASON_LABELS[reason]).toBeTruthy()
		}
		expect(REPORT_REASON_OPTIONS.map(option => option.value)).toEqual([
			...REPORT_REASONS,
		])
	})
})

describe('a blocked member row', () => {
	it('prefers a real name and falls back to the handle', () => {
		expect(
			blockedMemberName(block({ name: 'Ada', lastName: 'Lovelace' })),
		).toBe('Ada Lovelace')
		expect(blockedMemberName(block({ name: '', lastName: null }))).toBe('@them')
	})
})
