'use client'

import type {
	ModerationActionKind,
	ModerationReport,
} from '@sunsteel/contracts'
import { MODERATION_NOTE_MAX_LENGTH } from '@sunsteel/contracts'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
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
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import type { MessageKey } from '@/i18n/translator'
import {
	useDismissReport,
	useHideReportedContent,
	useLiftMessagingRestriction,
	useRestoreReportedContent,
	useRestrictMessaging,
} from '@/lib/api/hooks/useModeration'
import { describeReportSubject } from '@/lib/utils/moderation'

type ReviewAction = Exclude<ModerationActionKind, 'VIEW_SUBJECT'>

interface ReviewActionDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	action: ReviewAction
	report: ModerationReport
}

type ReviewKey = MessageKey<'social.reviewAction'>
type ModerationKey = MessageKey<'social.moderation'>

interface ActionCopy {
	title: ReviewKey
	confirm: ReviewKey
	done: ReviewKey
}

/** MSG-09: a message's hide and restore say what they do to a conversation. */
const MESSAGE_COPY: Partial<
	Record<ReviewAction, ActionCopy & { description: ModerationKey }>
> = {
	HIDE_SUBJECT: {
		title: 'hideMessageTitle',
		confirm: 'hideMessageConfirm',
		done: 'hideMessageDone',
		description: 'hideMessageExplanation',
	},
	RESTORE_SUBJECT: {
		title: 'restoreMessageTitle',
		confirm: 'restoreMessageConfirm',
		done: 'restoreMessageDone',
		description: 'restoreMessageExplanation',
	},
}

const DESCRIPTIONS: Record<
	Exclude<ReviewAction, 'DISMISS_REPORT'>,
	ModerationKey
> = {
	HIDE_SUBJECT: 'hideExplanation',
	RESTORE_SUBJECT: 'restoreExplanation',
	RESTRICT_MESSAGING: 'restrictExplanation',
	LIFT_MESSAGING_RESTRICTION: 'liftExplanation',
}

const COPY: Record<ReviewAction, ActionCopy> = {
	DISMISS_REPORT: {
		title: 'dismissTitle',
		confirm: 'dismissConfirm',
		done: 'dismissDone',
	},
	HIDE_SUBJECT: {
		title: 'hideTitle',
		confirm: 'hideConfirm',
		done: 'hideDone',
	},
	RESTORE_SUBJECT: {
		title: 'restoreTitle',
		confirm: 'restoreConfirm',
		done: 'restoreDone',
	},
	RESTRICT_MESSAGING: {
		title: 'restrictTitle',
		confirm: 'restrictConfirm',
		done: 'restrictDone',
	},
	LIFT_MESSAGING_RESTRICTION: {
		title: 'liftTitle',
		confirm: 'liftConfirm',
		done: 'liftDone',
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
	const errorText = useApiErrorMessage()
	const t = useTranslations('social.reviewAction')
	const tModeration = useTranslations('social.moderation')
	const { push } = useToast()
	const dismiss = useDismissReport()
	const hide = useHideReportedContent()
	const restore = useRestoreReportedContent()
	const restrict = useRestrictMessaging()
	const lift = useLiftMessagingRestriction()
	const [note, setNote] = useState('')

	const mutation = {
		DISMISS_REPORT: dismiss,
		HIDE_SUBJECT: hide,
		RESTORE_SUBJECT: restore,
		RESTRICT_MESSAGING: restrict,
		LIFT_MESSAGING_RESTRICTION: lift,
	}[action]
	const messageCopy =
		report.subject.kind === 'MESSAGE' ? MESSAGE_COPY[action] : undefined
	const keys = messageCopy ?? COPY[action]
	const copy = {
		title: t(keys.title),
		description:
			action === 'DISMISS_REPORT'
				? t('dismissDescription')
				: tModeration(messageCopy?.description ?? DESCRIPTIONS[action]),
		confirm: t(keys.confirm),
		done: t(keys.done),
	}

	const submit = () => {
		mutation.mutate(
			{ reportId: report.id, note: note.trim() || null },
			{
				onSuccess: () => {
					onOpenChange(false)
					setNote('')
					push({
						title: copy.done,
						description: t('recorded'),
						variant: 'success',
					})
				},
				onError: error =>
					push({
						title: t('failed'),
						description: errorText(error),
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
						{describeReportSubject(report.subject, tModeration)}
					</p>
					<div className="space-y-2">
						<Label htmlFor="moderation-note">{t('noteLabel')}</Label>
						<Textarea
							id="moderation-note"
							value={note}
							maxLength={MODERATION_NOTE_MAX_LENGTH}
							onChange={event => setNote(event.target.value)}
							placeholder={t('notePlaceholder')}
						/>
						<p className="type-body-sm text-ink-3">
							{t('noteCounter', {
								length: note.length,
								max: MODERATION_NOTE_MAX_LENGTH,
							})}
						</p>
					</div>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						{t('cancel')}
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
