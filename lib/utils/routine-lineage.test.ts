import type { RoutineLineage } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	describeLineageAuthor,
	describeRoutineLineage,
	lineageSourceHref,
} from './routine-lineage'

const visible: RoutineLineage = {
	sourceRoutineId: 'source-1',
	author: {
		username: 'author',
		name: 'Ada',
		lastName: 'Lovelace',
		avatarUrl: null,
	},
	isSourceHidden: false,
	clonedAt: '2026-09-18T10:00:00.000Z',
}

const hidden: RoutineLineage = {
	sourceRoutineId: null,
	author: null,
	isSourceHidden: true,
	clonedAt: '2026-09-18T10:00:00.000Z',
}

describe('routine lineage copy', () => {
	it('names the original author when the viewer may see the source', () => {
		expect(describeLineageAuthor(visible)).toBe('Ada Lovelace')
		expect(describeRoutineLineage(visible)).toMatch(/Cloned from Ada Lovelace/)
	})

	it('still says it is a clone when the source is hidden or gone', () => {
		// Saying nothing would quietly present somebody else's programme as
		// original work.
		expect(describeRoutineLineage(hidden)).toMatch(/Cloned from another/i)
		expect(describeRoutineLineage(hidden)).toMatch(/no longer available/i)
		expect(describeLineageAuthor(hidden)).toBeNull()
	})

	it('links to the source only when the viewer may open it', () => {
		expect(lineageSourceHref(visible)).toBe('/profile/author/routines/source-1')
		expect(lineageSourceHref(hidden)).toBeNull()
	})
})
