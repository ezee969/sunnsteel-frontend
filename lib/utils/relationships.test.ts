import type {
	FollowSuggestionsResponse,
	RelationshipListResponse,
} from '@sunsteel/contracts'
import type { InfiniteData } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import {
	getFollowSuggestionReason,
	getRelationshipEmptyMessage,
	getRelationshipListApiPath,
	getRelationshipListHref,
	parseRelationshipListKind,
	setFollowStateInRelationshipPages,
	setFollowStateInSuggestions,
} from '@/lib/utils/relationships'

const member = (id: string, isFollowedByMe = false) => ({
	id,
	username: `${id}_handle`,
	name: id,
	isFollowedByMe,
	followsMe: false,
})

describe('relationship routes', () => {
	it('accepts only the three list segments', () => {
		expect(parseRelationshipListKind('followers')).toBe('followers')
		expect(parseRelationshipListKind('mutuals')).toBe('mutuals')
		expect(parseRelationshipListKind('Followers')).toBeNull()
		expect(parseRelationshipListKind('posts')).toBeNull()
		expect(parseRelationshipListKind(undefined)).toBeNull()
	})

	it('builds encoded page and API paths with an optional cursor', () => {
		expect(getRelationshipListHref('atlas lifts', 'following')).toBe(
			'/profile/atlas%20lifts/following',
		)
		expect(getRelationshipListApiPath('atlas_lifts', 'followers')).toBe(
			'/users/atlas_lifts/followers',
		)
		expect(
			getRelationshipListApiPath('atlas_lifts', 'mutuals', {
				cursor: 'abc+/=',
				limit: 20,
			}),
		).toBe('/users/atlas_lifts/mutuals?cursor=abc%2B%2F%3D&limit=20')
	})
})

describe('relationship copy', () => {
	it('distinguishes your own lists from a member’s', () => {
		expect(
			getRelationshipEmptyMessage('followers', { isOwn: true, name: 'Ana' }),
		).toBe('No one follows you yet.')
		expect(
			getRelationshipEmptyMessage('following', { isOwn: false, name: 'Ana' }),
		).toBe('Ana is not following anyone yet.')
		expect(
			getRelationshipEmptyMessage('mutuals', { isOwn: false, name: 'Ana' }),
		).toBe('None of the people you follow follow Ana.')
	})

	it('explains why a member is suggested with correct pluralisation', () => {
		expect(
			getFollowSuggestionReason({ reason: 'FOLLOWS_YOU', mutualCount: 3 }),
		).toBe('Follows you')
		expect(
			getFollowSuggestionReason({
				reason: 'FOLLOWED_BY_PEOPLE_YOU_FOLLOW',
				mutualCount: 1,
			}),
		).toBe('Followed by 1 person you follow')
		expect(
			getFollowSuggestionReason({
				reason: 'FOLLOWED_BY_PEOPLE_YOU_FOLLOW',
				mutualCount: 4,
			}),
		).toBe('Followed by 4 people you follow')
	})
})

describe('follow state cache updates', () => {
	it('flips only the toggled member across every loaded page', () => {
		const data: InfiniteData<RelationshipListResponse> = {
			pageParams: [undefined, 'cursor-1'],
			pages: [
				{ kind: 'following', items: [member('a', true)], nextCursor: 'c' },
				{ kind: 'following', items: [member('b', true)] },
			],
		}
		const next = setFollowStateInRelationshipPages(data, 'b', false)
		expect(next?.pages[0].items[0].isFollowedByMe).toBe(true)
		expect(next?.pages[1].items[0].isFollowedByMe).toBe(false)
		expect(next?.pages[0].nextCursor).toBe('c')
		expect(data.pages[1].items[0].isFollowedByMe).toBe(true)
	})

	it('keeps suggested members in place after a follow', () => {
		const data: FollowSuggestionsResponse = {
			items: [
				{ ...member('a'), reason: 'FOLLOWS_YOU', mutualCount: 0 },
				{
					...member('b'),
					reason: 'FOLLOWED_BY_PEOPLE_YOU_FOLLOW',
					mutualCount: 2,
				},
			],
		}
		const next = setFollowStateInSuggestions(data, 'a', true)
		expect(next?.items.map(item => item.isFollowedByMe)).toEqual([true, false])
		expect(setFollowStateInSuggestions(undefined, 'a', true)).toBeUndefined()
	})
})
