'use client'

import type {
	ModerationActionKind,
	ModerationReport,
} from '@sunsteel/contracts'
import { MODERATION_NOTE_MAX_LENGTH } from '@sunsteel/contracts'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import {
	useDismissReport,
	useHideReportedContent,
	useRestoreReportedContent,
} from '@/lib/api/hooks/useModeration'
import {
	describeReportSubject,
	MODERATION_HIDE_EXPLANATION,
	MODERATION_RESTORE_EXPLANATION,
} from '@/lib/utils/moderation'

type ReviewAction = Exclude<ModerationActionKind, 'VIEW_SUBJECT'>

interface ReviewActionDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	action: ReviewAction
	report: ModerationReport
}

const COPY: Record<
	ReviewAction,
	{ title: string; description: string; confirm: string; done: string }
> = {
	DISMISS_REPORT: {
		title: 'Dismiss this report',
		description:
			'The report leaves the queue and nothing happens to the content. The reporter is not told either way, which is what they were told when they filed it.',
		confirm: 'Dismiss report',
		done: 'Report dismissed',
	},
	HIDE_SUBJECT: {
		title: 'Hide this content',
		description: MODERATION_HIDE_EXPLANATION,
		confirm: 'Hide content',
		done: 'Content hidden',
	},
	RESTORE_SUBJECT: {
		title: 'Restore this content',
		description: MODERATION_RESTORE_EXPLANATION,
		confirm: 'Restore content',
		done: 'Content restored',
	},
}

/**
 * Every review action is confirmed and explained first. A dismiss cannot be
 * taken back and a hide changes what everyone else can reach, so neither is a
 * one-click control; the note is the reviewer's own record of why, and the
 * dialog says plainly that nobody is told about it.
 */
export function ReviewActionDialog({
	open,
	onOpenChange,
	action,
	report,
}: ReviewActionDialogProps) {
	const { push } = useToast()
	const dismiss = useDismissReport()
	const hide = useHideReportedContent()
	const restore = useRestoreReportedContent()
	const [note, setNote] = useState('')

	const mutation =
		action === 'DISMISS_REPORT'
			? dismiss
			: action === 'HIDE_SUBJECT'
				? hide
				: restore
	const copy = COPY[action]

	const submit = () => {
		mutation.mutate(
			{ reportId: report.id, note: note.trim() || null },
			{
				onSuccess: () => {
					onOpenChange(false)
					setNote('')
					push({
						title: copy.done,
						description: 'The action was recorded and cannot be edited.',
						variant: 'success',
					})
				},
				onError: error =>
					push({
						title: 'Could not complete this action',
						description: error.message,
						variant: 'destructive',
					}),
			},
		)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{copy.title}</DialogTitle>
					<DialogDescription>{copy.description}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<p className="type-body-sm text-ink-3">
						{describeReportSubject(report.subject)}
					</p>
					<div className="space-y-2">
						<Label htmlFor="moderation-note">
							Note for the record (optional)
						</Label>
						<Textarea
							id="moderation-note"
							value={note}
							maxLength={MODERATION_NOTE_MAX_LENGTH}
							onChange={event => setNote(event.target.value)}
							placeholder="Why you decided this."
						/>
						<p className="type-body-sm text-ink-3">
							{note.length}/{MODERATION_NOTE_MAX_LENGTH} · Kept in the record.
							Neither the reporter nor the owner is shown it.
						</p>
					</div>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button type="button" onClick={submit} disabled={mutation.isPending}>
						{mutation.isPending ? (
							<Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
						) : null}
						{copy.confirm}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
