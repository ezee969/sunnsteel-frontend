import type {
	FeaturedProfileSelection,
	ReplaceFeaturedProfileItemsRequest,
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

export function addFeaturedRecord(
	items: FeaturedProfileSelection[],
	exerciseId: string,
): FeaturedProfileSelection[] {
	const key = `RECORD:${exerciseId}`
	if (items.some(item => featuredProfileSelectionKey(item) === key))
		return items
	return [
		...items,
		{ kind: 'RECORD', referenceId: exerciseId, position: items.length },
	]
}

export function buildFeaturedProfileRequest(
	items: FeaturedProfileSelection[],
): ReplaceFeaturedProfileItemsRequest {
	return {
		items: items.map(({ kind, referenceId }) => ({ kind, referenceId })),
	}
}
