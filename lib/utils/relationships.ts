import type {
	FollowSuggestion,
	FollowSuggestionsResponse,
	RelationshipListKind,
	RelationshipListQuery,
	RelationshipListResponse,
} from '@sunsteel/contracts'
import { RELATIONSHIP_LIST_KINDS } from '@sunsteel/contracts'
import type { InfiniteData } from '@tanstack/react-query'

import type { MessageKey, Translator } from '@/i18n/translator'

type T = Translator<'social.relationships'>

const RELATIONSHIP_LIST_LABELS: Record<
	RelationshipListKind,
	MessageKey<'social.relationships'>
> = {
	followers: 'followers',
	following: 'following',
	mutuals: 'mutuals',
}

export function getRelationshipListLabel(
	kind: RelationshipListKind,
	t: T,
): string {
	return t(RELATIONSHIP_LIST_LABELS[kind])
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
	t: T,
): string {
	if (kind === 'followers') {
		return isOwn ? t('emptyFollowersOwn') : t('emptyFollowers', { name })
	}
	if (kind === 'following') {
		return isOwn ? t('emptyFollowingOwn') : t('emptyFollowing', { name })
	}
	return isOwn ? t('emptyMutualsOwn') : t('emptyMutuals', { name })
}

/** One line that says who a mutuals list contains, since it is viewer-relative. */
export function getMutualsDescription(
	{
		isOwn,
		name,
	}: {
		isOwn: boolean
		name: string
	},
	t: T,
): string {
	return isOwn ? t('mutualsOwn') : t('mutualsOther', { name })
}

export function getFollowSuggestionReason(
	suggestion: Pick<FollowSuggestion, 'reason' | 'mutualCount'>,
	t: T,
): string {
	if (suggestion.reason === 'FOLLOWS_YOU') return t('followsYou')
	return t('followedBy', { count: suggestion.mutualCount })
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
