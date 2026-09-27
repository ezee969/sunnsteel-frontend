'use client'

import type { RelationshipListKind } from '@sunsteel/contracts'
import { RELATIONSHIP_LIST_KINDS } from '@sunsteel/contracts'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { PageTabs } from '@/components/layout/page-tabs'
import { Button } from '@/components/ui/button'
import {
	RelationshipMemberRow,
	RelationshipRowsLoading,
} from '@/features/profile/relationship-member-row'
import { useRelationshipList } from '@/lib/api/hooks/useRelationships'
import {
	getMutualsDescription,
	getRelationshipEmptyMessage,
	getRelationshipListHref,
	getRelationshipListLabel,
} from '@/lib/utils/relationships'

type RelationshipListsViewProps = {
	profile: {
		username: string
		name: string
		lastName?: string | null
		followerCount: number
		followingCount: number
	}
	kind: RelationshipListKind
	viewerId: string
	isOwn: boolean
	profileHref: string
}

export function RelationshipListsView({
	profile,
	kind,
	viewerId,
	isOwn,
	profileHref,
}: RelationshipListsViewProps) {
	const list = useRelationshipList(profile.username, kind)
	const items = list.data?.pages.flatMap(page => page.items) ?? []
	const fullName = [profile.name, profile.lastName].filter(Boolean).join(' ')
	const label = getRelationshipListLabel(kind)
	const counts: Partial<Record<RelationshipListKind, number>> = {
		followers: profile.followerCount,
		following: profile.followingCount,
	}

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6 pb-20">
			<div className="rule-heading space-y-1 pb-4">
				<div>
					<Button asChild variant="ghost" size="sm" className="-ml-3">
						<Link href={profileHref}>
							<ArrowLeft aria-hidden /> Profile
						</Link>
					</Button>
				</div>
				<h1 className="type-page corner-brackets inline-block text-foreground">
					{fullName}
				</h1>
				<p className="type-data text-ink-3">@{profile.username}</p>
			</div>

			{/* Route tabs (design system §21): each list has its own URL. */}
			<PageTabs
				label="Connections"
				tabs={RELATIONSHIP_LIST_KINDS.map(option => ({
					href: getRelationshipListHref(profile.username, option),
					label: getRelationshipListLabel(option),
					count: counts[option],
				}))}
			/>

			<section aria-label={label} className="space-y-3">
				{kind === 'mutuals' ? (
					<p className="type-body-sm text-ink-3">
						{getMutualsDescription({ isOwn, name: profile.name })}
					</p>
				) : null}

				{list.isPending ? (
					<RelationshipRowsLoading />
				) : list.isError && items.length === 0 ? (
					<div role="alert" className="space-y-3 py-3">
						<p className="type-panel text-foreground">
							Could not load {label.toLowerCase()}
						</p>
						<p className="type-body-sm text-ink-3">
							Check your connection and try again.
						</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => void list.refetch()}
						>
							Try again
						</Button>
					</div>
				) : items.length === 0 ? (
					<p className="type-body-sm py-3 text-ink-3">
						{getRelationshipEmptyMessage(kind, {
							isOwn,
							name: profile.name,
						})}
					</p>
				) : (
					<>
						<ul>
							{items.map(member => (
								<RelationshipMemberRow
									key={member.id}
									member={member}
									isSelf={member.id === viewerId}
									caption={
										member.followsMe && member.id !== viewerId
											? 'Follows you'
											: undefined
									}
								/>
							))}
						</ul>
						{list.isFetchNextPageError ? (
							<p role="alert" className="type-body-sm text-ink-3">
								Could not load more members. Try again.
							</p>
						) : null}
						{list.hasNextPage ? (
							<div className="flex justify-center pt-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => void list.fetchNextPage()}
									disabled={list.isFetchingNextPage}
								>
									{list.isFetchingNextPage ? 'Loading…' : 'Load more'}
								</Button>
							</div>
						) : null}
					</>
				)}
			</section>
		</div>
	)
}
