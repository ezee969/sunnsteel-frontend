import type {
	FollowSuggestion,
	FollowSuggestionsResponse,
	RelationshipListKind,
	RelationshipListQuery,
	RelationshipListResponse,
} from '@sunsteel/contracts'
import { RELATIONSHIP_LIST_KINDS } from '@sunsteel/contracts'
import type { InfiniteData } from '@tanstack/react-query'

const RELATIONSHIP_LIST_LABELS: Record<RelationshipListKind, string> = {
	followers: 'Followers',
	following: 'Following',
	mutuals: 'Mutuals',
}

export function getRelationshipListLabel(kind: RelationshipListKind): string {
	return RELATIONSHIP_LIST_LABELS[kind]
}

/** Reads the optional second `/profile/<identifier>/<kind>` segment. */
export function parseRelationshipListKind(
	segment: string | undefined,
): RelationshipListKind | null {
	return RELATIONSHIP_LIST_KINDS.find(kind => kind === segment) ?? null
}

export function getRelationshipListHref(
	username: string,
	kind: RelationshipListKind,
): string {
	return `/profile/${encodeURIComponent(username)}/${kind}`
}

export function getRelationshipListApiPath(
	identifier: string,
	kind: RelationshipListKind,
	query: RelationshipListQuery = {},
): string {
	const params = new URLSearchParams()
	if (query.cursor) params.set('cursor', query.cursor)
	if (query.limit !== undefined) params.set('limit', String(query.limit))
	const search = params.toString()
	return `/users/${encodeURIComponent(identifier)}/${kind}${search ? `?${search}` : ''}`
}

export function getRelationshipEmptyMessage(
	kind: RelationshipListKind,
	{ isOwn, name }: { isOwn: boolean; name: string },
): string {
	if (kind === 'followers') {
		return isOwn ? 'No one follows you yet.' : `No one follows ${name} yet.`
	}
	if (kind === 'following') {
		return isOwn
			? 'You are not following anyone yet.'
			: `${name} is not following anyone yet.`
	}
	return isOwn
		? 'No mutual follows yet. Members you follow back will show up here.'
		: `None of the people you follow follow ${name}.`
}

/** One line that says who a mutuals list contains, since it is viewer-relative. */
export function getMutualsDescription({
	isOwn,
	name,
}: {
	isOwn: boolean
	name: string
}): string {
	return isOwn
		? 'Members who follow you and whom you follow back.'
		: `People you follow who also follow ${name}.`
}

export function getFollowSuggestionReason(
	suggestion: Pick<FollowSuggestion, 'reason' | 'mutualCount'>,
): string {
	if (suggestion.reason === 'FOLLOWS_YOU') return 'Follows you'
	const count = suggestion.mutualCount
	return `Followed by ${count} ${count === 1 ? 'person' : 'people'} you follow`
}

/**
 * Follow toggles from a list update the row in place instead of refetching,
 * so an unfollow on your own Following list does not make the row vanish
 * before the user can undo it.
 */
export function setFollowStateInRelationshipPages(
	data: InfiniteData<RelationshipListResponse> | undefined,
	userId: string,
	isFollowedByMe: boolean,
): InfiniteData<RelationshipListResponse> | undefined {
	if (!data) return data
	return {
		...data,
		pages: data.pages.map(page => ({
			...page,
			items: page.items.map(item =>
				item.id === userId ? { ...item, isFollowedByMe } : item,
			),
		})),
	}
}

export function setFollowStateInSuggestions(
	data: FollowSuggestionsResponse | undefined,
	userId: string,
	isFollowedByMe: boolean,
): FollowSuggestionsResponse | undefined {
	if (!data) return data
	return {
		items: data.items.map(item =>
			item.id === userId ? { ...item, isFollowedByMe } : item,
		),
	}
}
