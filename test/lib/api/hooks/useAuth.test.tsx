// Legacy useAuth test neutralized after Supabase migration.
// Marked as skipped to prevent failure: "No test suite found".
import { describe, it, expect } from 'vitest'

describe.skip('legacy useAuth (removed)', () => {
	it('placeholder', () => {
		expect(true).toBe(true)
	})
})
