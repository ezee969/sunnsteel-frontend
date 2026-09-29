import type { RoutineLineage } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	describeLineageAuthor,
	describeRoutineLineage,
	lineageSourceHref,
} from './routine-lineage'

const en = translatorFor('en', 'routines.lineage')
const es = translatorFor('es', 'routines.lineage')

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
		expect(describeRoutineLineage(visible, en)).toMatch(/Cloned from Ada Lovelace/)
	})

	it('still says it is a clone when the source is hidden or gone', () => {
		// Saying nothing would quietly present somebody else's programme as
		// original work.
		expect(describeRoutineLineage(hidden, en)).toMatch(/Cloned from another/i)
		expect(describeRoutineLineage(hidden, en)).toMatch(/no longer available/i)
		expect(describeLineageAuthor(hidden)).toBeNull()
	})

	it('says the same in Spanish, hidden or not (I18N-03)', () => {
		expect(describeRoutineLineage(visible, es)).toMatch(/Clonada de Ada Lovelace/)
		expect(describeRoutineLineage(hidden, es)).toMatch(/Clonada de la rutina de otro miembro/)
		expect(describeRoutineLineage(hidden, es)).toMatch(/ya no está disponible/)
	})

	it('links to the source only when the viewer may open it', () => {
		expect(lineageSourceHref(visible)).toBe('/profile/author/routines/source-1')
		expect(lineageSourceHref(hidden)).toBeNull()
	})
})
