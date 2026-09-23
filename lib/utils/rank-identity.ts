import {
	RENAISSANCE_RANK_DEFINITIONS,
	type RenaissanceRankDefinition,
} from '@sunsteel/contracts'

/**
 * ACH-09. Each Renaissance rank has an identity - a crest and a pigment -
 * keyed by the stable rank ID the contract returns, never by its title or by
 * a position a caller computed. Design system §19 owns the values and rules.
 */
export type RenaissanceRankId = RenaissanceRankDefinition['id']

/**
 * Literal class names, so Tailwind emits each one. The tokens are mark-grade
 * (3:1) and colour only the crest; the rank name beside it stays ink (§19.2).
 */
export const RANK_CREST_COLOR_CLASS: Record<RenaissanceRankId, string> = {
	INITIATE: 'text-rank-initiate',
	APPRENTICE: 'text-rank-apprentice',
	ARTISAN: 'text-rank-artisan',
	MAESTRO: 'text-rank-maestro',
	VIRTUOSO: 'text-rank-virtuoso',
	LAUREATE: 'text-rank-laureate',
}

/** A rank the member does not hold yet is drawn in ink-3, never its pigment. */
export const UNREACHED_RANK_CREST_CLASS = 'text-ink-3'

export function isRenaissanceRankId(id: string): id is RenaissanceRankId {
	return Object.prototype.hasOwnProperty.call(RANK_CREST_COLOR_CLASS, id)
}

/**
 * The crest's tier: 0 for Initiate up to 5 for Laureate, following the
 * contract's ladder order. -1 for an ID the ladder does not know, which the
 * crest renders as nothing rather than guessing.
 */
export function rankCrestTier(id: string): number {
	return RENAISSANCE_RANK_DEFINITIONS.findIndex(rank => rank.id === id)
}

export function rankCrestColorClass(id: string, reached = true): string {
	if (!reached || !isRenaissanceRankId(id)) return UNREACHED_RANK_CREST_CLASS
	return RANK_CREST_COLOR_CLASS[id]
}
