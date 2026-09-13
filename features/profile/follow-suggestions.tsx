'use client'

import { Button } from '@/components/ui/button'
import {
	RelationshipMemberRow,
	RelationshipRowsLoading,
} from '@/features/profile/relationship-member-row'
import { useFollowSuggestions } from '@/lib/api/hooks/useRelationships'
import { getFollowSuggestionReason } from '@/lib/utils/relationships'

export function FollowSuggestions() {
	const suggestions = useFollowSuggestions()
	const items = suggestions.data?.items ?? []

	return (
		<section aria-labelledby="follow-suggestions-heading" className="space-y-2">
			<h2
				id="follow-suggestions-heading"
				className="type-section rule-heading pb-2 text-foreground"
			>
				People you may know
			</h2>
			{suggestions.isPending ? (
				<RelationshipRowsLoading rows={3} />
			) : suggestions.isError && items.length === 0 ? (
				<div role="alert" className="space-y-3 py-3">
					<p className="type-body-sm text-ink-3">
						Suggestions are unavailable right now.
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => void suggestions.refetch()}
					>
						Try again
					</Button>
				</div>
			) : items.length === 0 ? (
				<p className="type-body-sm py-3 text-ink-3">
					No suggestions yet. Once you follow a few members, people they follow
					will appear here.
				</p>
			) : (
				<ul>
					{items.map(suggestion => (
						<RelationshipMemberRow
							key={suggestion.id}
							member={suggestion}
							caption={getFollowSuggestionReason(suggestion)}
						/>
					))}
				</ul>
			)}
		</section>
	)
}
