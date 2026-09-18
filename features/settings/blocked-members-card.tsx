'use client'

import { Loader2, ShieldBan } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import {
	useBlockedMembers,
	useUnblockMember,
} from '@/lib/api/hooks/useModeration'
import {
	BLOCK_LINK_CAVEAT,
	blockedMemberName,
	describeBlockedSince,
} from '@/lib/utils/moderation'

/**
 * PROF-10: the one place the whole block list is visible. It repeats what a
 * block cannot do, because this is where someone comes to check that it
 * worked — and a link they shared earlier still working is the part that
 * would otherwise look like a failure.
 */
export function BlockedMembersCard() {
	const blocks = useBlockedMembers()
	const unblock = useUnblockMember()
	const { push } = useToast()
	const items = blocks.data?.blocks ?? []

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<ShieldBan className="size-5 text-ink-3" aria-hidden />
					<CardTitle>Blocked Members</CardTitle>
				</div>
				<CardDescription>
					Blocking works both ways: neither of you appears in the other’s
					search, suggestions, follower lists or profile, and any follow between
					you is removed. {BLOCK_LINK_CAVEAT}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{blocks.isLoading ? (
					<div className="type-body-sm flex items-center justify-center gap-2 py-8 text-ink-3">
						<Loader2 className="size-4 animate-spin" aria-hidden />
						Loading blocked members…
					</div>
				) : blocks.error ? (
					<div
						role="alert"
						className="border border-destructive bg-surface p-4"
					>
						<p className="type-body-sm text-destructive">
							{blocks.error.message}
						</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="mt-3"
							onClick={() => void blocks.refetch()}
						>
							Try Again
						</Button>
					</div>
				) : items.length ? (
					<div className="border-t border-rule-faint">
						{items.map(block => (
							<div
								key={block.member.id}
								className="rule-row flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
							>
								<div className="min-w-0">
									<p className="type-panel text-foreground">
										{blockedMemberName(block)}
									</p>
									<p className="type-body-sm text-ink-3">
										@{block.member.username} · blocked{' '}
										{describeBlockedSince(block)}
									</p>
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									aria-label={`Unblock ${blockedMemberName(block)}`}
									disabled={unblock.isPending}
									onClick={() =>
										unblock.mutate(block.member.username, {
											onSuccess: () =>
												push({
													title: 'Member unblocked',
													description: `@${block.member.username} can find and follow you again.`,
													variant: 'success',
												}),
											onError: error =>
												push({
													title: 'Could not unblock this member',
													description: error.message,
													variant: 'destructive',
												}),
										})
									}
								>
									Unblock
								</Button>
							</div>
						))}
					</div>
				) : (
					<p className="type-body-sm py-4 text-ink-3">
						You have not blocked anyone. You can block a member from their{' '}
						<Link
							href="/search"
							className="text-primary underline-offset-4 hover:underline"
						>
							profile
						</Link>
						.
					</p>
				)}
			</CardContent>
		</Card>
	)
}
