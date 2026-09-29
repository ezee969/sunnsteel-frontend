import type { Translator } from './translator'

/**
 * I18N-07: labels for product content that lives in data rather than in
 * components -- catalog exercises, milestone achievements and ranks.
 *
 * **Catalog exercises are keyed by their stored English name**, not by id:
 * catalog ids are generated per environment, while a catalog name is unique
 * and stable (starter templates already resolve by it), and a member's own
 * exercise can never take a catalog name (EXER-06), so a name in the list is
 * always the catalog's. Anything not in the list -- a member's own exercise,
 * or a catalog row added later -- is shown exactly as stored.
 */
type Lookup = ((key: string, values?: Record<string, unknown>) => string) & {
	has: (key: string) => boolean
}

export function exerciseLabel(
	name: string,
	t: Translator<'catalog.exercises'>,
): string {
	const lookup = t as unknown as Lookup
	return name && lookup.has(name) ? lookup(name) : name
}

const ACHIEVEMENT_ID = /^([a-z_]+):(\d+)$/

/**
 * A milestone's title and description from its stable id
 * (`<category>:<threshold>`), in the viewer's language. An id that does not
 * parse keeps the text it arrived with.
 */
export function achievementText(
	achievement: { id: string; title: string; description?: string },
	t: Translator<'catalog.achievements'>,
): { title: string; description: string } {
	const match = ACHIEVEMENT_ID.exec(achievement.id)
	const lookup = t as unknown as Lookup
	const category = match?.[1].toUpperCase()
	if (!match || !category || !lookup.has(`${category}.title`))
		return {
			title: achievement.title,
			description: achievement.description ?? '',
		}
	const threshold = Number(match[2])
	const values = { count: threshold, threshold }
	return {
		title: lookup(`${category}.title`, values),
		description: lookup(`${category}.description`, values),
	}
}

/** A rank's title and description from its stable id. */
export function rankText(
	rank: { id: string; title: string; description?: string },
	t: Translator<'catalog.ranks'>,
): { title: string; description: string } {
	const lookup = t as unknown as Lookup
	if (!lookup.has(`${rank.id}.title`))
		return { title: rank.title, description: rank.description ?? '' }
	return {
		title: lookup(`${rank.id}.title`),
		description: lookup(`${rank.id}.description`),
	}
}
