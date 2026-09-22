'use client'

import type {
	ActivityComment,
	ActivityCommentSummary,
} from '@sunsteel/contracts'
import {
	ACTIVITY_COMMENT_MAX_LENGTH,
	ACTIVITY_COMMENTS_PER_DAY_MAX,
} from '@sunsteel/contracts'
import { Flag, Loader2, MessageSquare, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { ReportDialog } from '@/features/profile/report-dialog'
import {
	useActivityComments,
	useCreateActivityComment,
	useDeleteActivityComment,
} from '@/lib/api/hooks/useActivity'
import { useUser } from '@/lib/api/hooks/useUser'
import {
	ACTIVITY_COMMENT_PLACEHOLDER,
	ACTIVITY_COMMENTS_EMPTY,
	describeCommentBudgetSpent,
	describeCommentDelete,
} from '@/lib/utils/activity'
import { formatTimeAgo } from '@/lib/utils/date'

/**
 * SOC-06. Discussion attached to one verified fact, never a posting surface.
 *
 * The list is **collapsed until asked for**: an entry carries only its count,
 * and a feed page that fetched every comment on every entry would read the
 * whole conversation to show a number. Opening one is what loads it.
 *
 * There are no threads, no mentions, no editing and no reactions on comments.
 * Adding any of them is a new decision rather than an extension of this one.
 */
export function ActivityComments({
	entryId,
	summary,
}: {
	entryId: string
	summary: ActivityCommentSummary
}) {
	const [open, setOpen] = useState(false)

	return (
		<div className="mt-2">
			<Button
				type="button"
				variant="ghost"
				size="sm"
				aria-expanded={open}
				onClick={() => setOpen(current => !current)}
			>
				<MessageSquare className="size-4" aria-hidden />
				{summary.count === 0
					? 'Comment'
					: `${summary.count} ${summary.count === 1 ? 'comment' : 'comments'}`}
			</Button>
			{open ? <CommentThread entryId={entryId} summary={summary} /> : null}
		</div>
	)
}

function CommentThread({
	entryId,
	summary,
}: {
	entryId: string
	summary: ActivityCommentSummary
}) {
	const comments = useActivityComments(entryId)
	const create = useCreateActivityComment()
	const { push } = useToast()
	const [body, setBody] = useState('')
	const rows = (comments.data?.pages ?? []).flatMap(page => page.comments)
	// The server's own answer once the list has loaded, which knows the budget
	// as of now rather than as of when the feed page was built.
	const live = comments.data?.pages[0]?.summary ?? summary

	const submit = () => {
		const trimmed = body.trim()
		if (!trimmed) return
		create.mutate(
			{ entryId, body: trimmed },
			{
				onSuccess: () => setBody(''),
				onError: error =>
					push({
						title: 'Could not post this comment',
						description: error.message,
						variant: 'destructive',
					}),
			},
		)
	}

	return (
		<div className="mt-2 border-l border-rule-faint pl-3">
			{comments.isLoading ? (
				<p className="type-body-sm flex items-center gap-2 py-2 text-ink-3">
					<Loader2 className="size-3.5 animate-spin" aria-hidden />
					Loading comments…
				</p>
			) : comments.error ? (
				<div role="alert" className="py-2">
					<p className="type-body-sm text-destructive">
						{comments.error.message}
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="mt-2"
						onClick={() => void comments.refetch()}
					>
						Try Again
					</Button>
				</div>
			) : rows.length ? (
				<ul>
					{rows.map(comment => (
						<CommentRow key={comment.id} comment={comment} />
					))}
				</ul>
			) : (
				<p className="type-body-sm py-2 text-ink-3">
					{ACTIVITY_COMMENTS_EMPTY}
				</p>
			)}

			{comments.hasNextPage ? (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					disabled={comments.isFetchingNextPage}
					onClick={() => void comments.fetchNextPage()}
				>
					{comments.isFetchingNextPage ? 'Loading…' : 'Older comments'}
				</Button>
			) : null}

			{live.canComment ? (
				<div className="mt-2 space-y-2">
					<Textarea
						aria-label="Write a comment"
						value={body}
						maxLength={ACTIVITY_COMMENT_MAX_LENGTH}
						placeholder={ACTIVITY_COMMENT_PLACEHOLDER}
						onChange={event => setBody(event.target.value)}
					/>
					<div className="flex items-center justify-between gap-2">
						<p className="type-body-sm text-ink-3">
							{body.length}/{ACTIVITY_COMMENT_MAX_LENGTH}
						</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={!body.trim() || create.isPending}
							onClick={submit}
						>
							{create.isPending ? (
								<Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
							) : null}
							Post comment
						</Button>
					</div>
				</div>
			) : (
				// The reason replaces the control: a composer that refuses on click
				// reads as broken.
				<p className="type-body-sm mt-2 text-ink-3">
					{describeCommentBudgetSpent(ACTIVITY_COMMENTS_PER_DAY_MAX)}
				</p>
			)}
		</div>
	)
}

function CommentRow({ comment }: { comment: ActivityComment }) {
	const remove = useDeleteActivityComment()
	const { push } = useToast()
	const [reporting, setReporting] = useState(false)
	const [confirming, setConfirming] = useState(false)
	const { user } = useUser()
	// Only to word the confirmation. Whether the delete is *allowed* is
	// `canDelete`, which the server resolved.
	const isOwnComment = comment.author.id === user?.id
	const name =
		[comment.author.name, comment.author.lastName].filter(Boolean).join(' ') ||
		`@${comment.author.username}`

	return (
		<li className="rule-row flex flex-col gap-1 py-2">
			<div className="flex flex-wrap items-baseline gap-x-2">
				<Link
					href={`/profile/${encodeURIComponent(comment.author.username)}`}
					className="type-panel text-foreground underline-offset-4 hover:underline"
				>
					{name}
				</Link>
				<span className="type-body-sm text-ink-3">
					{formatTimeAgo(comment.createdAt)}
				</span>
			</div>
			<p className="type-body-sm whitespace-pre-wrap text-ink-2">
				{comment.body}
			</p>
			<div className="flex flex-wrap gap-1">
				{comment.canDelete ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						aria-label={`Delete comment by ${name}`}
						disabled={remove.isPending}
						onClick={() => setConfirming(true)}
					>
						<Trash2 className="size-3.5" aria-hidden />
						Delete
					</Button>
				) : null}
				<Button
					type="button"
					variant="ghost"
					size="sm"
					aria-label={`Report comment by ${name}`}
					onClick={() => setReporting(true)}
				>
					<Flag className="size-3.5" aria-hidden />
					Report
				</Button>
			</div>
			{/* Deleting is permanent and may be removing somebody else's words —
			    the owner of an activity can delete a comment on it — so it
			    confirms and says which of the two it is. */}
			<AlertDialog open={confirming} onOpenChange={setConfirming}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this comment?</AlertDialogTitle>
						<AlertDialogDescription>
							{describeCommentDelete(isOwnComment)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								remove.mutate(comment.id, {
									onError: error =>
										push({
											title: 'Could not delete this comment',
											description: error.message,
											variant: 'destructive',
										}),
								})
							}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<ReportDialog
				open={reporting}
				onOpenChange={setReporting}
				subjectKind="COMMENT"
				subjectId={comment.id}
			/>
		</li>
	)
}
