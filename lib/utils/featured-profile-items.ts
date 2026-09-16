import type {
	FeaturedProfileItemKind,
	FeaturedProfileSelection,
	ReplaceFeaturedProfileItemsRequest,
} from '@sunsteel/contracts'
import {
	FEATURED_PROFILE_ITEMS_MAX,
	RENAISSANCE_RANK_DEFINITIONS,
} from '@sunsteel/contracts'

export function featuredProfileSelectionKey(
	item: Pick<FeaturedProfileSelection, 'kind' | 'referenceId'>,
) {
	return `${item.kind}:${item.referenceId}`
}

export function moveFeaturedProfileItem(
	items: FeaturedProfileSelection[],
	from: number,
	to: number,
): FeaturedProfileSelection[] {
	if (
		from === to ||
		from < 0 ||
		to < 0 ||
		from >= items.length ||
		to >= items.length
	) {
		return items
	}
	const next = [...items]
	const [moved] = next.splice(from, 1)
	next.splice(to, 0, moved)
	return next.map((item, position) => ({ ...item, position }))
}

export function removeFeaturedProfileItem(
	items: FeaturedProfileSelection[],
	key: string,
): FeaturedProfileSelection[] {
	return items
		.filter(item => featuredProfileSelectionKey(item) !== key)
		.map((item, position) => ({ ...item, position }))
}

export function addFeaturedProfileItem(
	items: FeaturedProfileSelection[],
	kind: FeaturedProfileItemKind,
	referenceId: string,
): FeaturedProfileSelection[] {
	if (items.length >= FEATURED_PROFILE_ITEMS_MAX) return items
	if (kind === 'RANK' && items.some(item => item.kind === 'RANK')) return items

	const key = `${kind}:${referenceId}`
	if (items.some(item => featuredProfileSelectionKey(item) === key))
		return items
	return [...items, { kind, referenceId, position: items.length }]
}

export function reachedRenaissanceRanks(currentRankId?: string) {
	if (!currentRankId) return []
	const currentIndex = RENAISSANCE_RANK_DEFINITIONS.findIndex(
		rank => rank.id === currentRankId,
	)
	return currentIndex < 0
		? []
		: RENAISSANCE_RANK_DEFINITIONS.slice(0, currentIndex + 1)
}

export function buildFeaturedProfileRequest(
	items: FeaturedProfileSelection[],
): ReplaceFeaturedProfileItemsRequest {
	return {
		items: items.map(({ kind, referenceId }) => ({ kind, referenceId })),
	}
}
