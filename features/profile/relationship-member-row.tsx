'use client'

import type { RelationshipMember } from '@sunsteel/contracts'
import { UserMinus, UserPlus } from 'lucide-react'
import Link from 'next/link'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { useRelationshipFollowToggle } from '@/lib/api/hooks/useRelationships'

type RelationshipMemberRowProps = {
	member: RelationshipMember
	/** Sentence-case context after the handle, e.g. "Follows you". */
	caption?: string
	isSelf?: boolean
}

// §11.5 ruled row. The follow control repeats on every row, so it is never the
// primary (§4.3 rule 1): outline in both states, with the verb carrying state.
export function RelationshipMemberRow({
	member,
	caption,
	isSelf = false,
}: RelationshipMemberRowProps) {
	const toggle = useRelationshipFollowToggle()
	const { push } = useToast()
	const fullName = [member.name, member.lastName].filter(Boolean).join(' ')
	const isFollowed = member.isFollowedByMe

	const onToggle = () => {
		toggle.mutate(
			{ userId: member.id, follow: !isFollowed },
			{
				onError: () =>
					push({
						title: isFollowed
							? `Could not unfollow ${member.name}`
							: `Could not follow ${member.name}`,
						description: 'Check your connection and try again.',
						variant: 'destructive',
					}),
			},
		)
	}

	return (
		<li className="rule-row flex items-center gap-3 py-3">
			<Link
				href={`/profile/${encodeURIComponent(member.username)}`}
				className="group flex min-w-0 flex-1 items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
			>
				<Avatar className="h-10 w-10 shrink-0 border border-rule">
					<AvatarImage
						src={member.avatarUrl || ''}
						alt=""
						className="object-cover"
					/>
					<AvatarFallback className="type-data bg-surface-sunk text-ink-2">
						{member.name.charAt(0)}
						{member.lastName?.charAt(0)}
					</AvatarFallback>
				</Avatar>
				<span className="min-w-0">
					<span className="type-panel block truncate text-foreground underline-offset-4 group-hover:underline">
						{fullName}
					</span>
					<span className="type-body-sm block truncate text-ink-3">
						@{member.username}
						{caption ? ` · ${caption}` : ''}
					</span>
				</span>
			</Link>
			{isSelf ? (
				<span className="type-body-sm shrink-0 text-ink-3">You</span>
			) : (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="shrink-0"
					onClick={onToggle}
					disabled={toggle.isPending}
					aria-label={`${isFollowed ? 'Unfollow' : 'Follow'} ${fullName}`}
				>
					{isFollowed ? <UserMinus aria-hidden /> : <UserPlus aria-hidden />}
					{toggle.isPending
						? isFollowed
							? 'Unfollowing...'
							: 'Following...'
						: isFollowed
							? 'Unfollow'
							: 'Follow'}
				</Button>
			)}
		</li>
	)
}

export function RelationshipRowsLoading({ rows = 5 }: { rows?: number }) {
	return (
		<ul aria-busy="true" aria-label="Loading members">
			{Array.from({ length: rows }).map((_, index) => (
				<li key={index} className="rule-row flex items-center gap-3 py-3">
					<Skeleton className="h-10 w-10 shrink-0 rounded-full" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-4 w-40 max-w-full" />
						<Skeleton className="h-3 w-24" />
					</div>
				</li>
			))}
		</ul>
	)
}
