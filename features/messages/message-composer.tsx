'use client'

import { MESSAGE_BODY_MAX, type SendMessageRequest } from '@sunsteel/contracts'
import {
	ClipboardList,
	Dumbbell,
	Loader2,
	Paperclip,
	Send,
	X,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { composerState, enterSends } from '@/lib/utils/messages'

import { AttachPicker } from './attach-picker'

/** MSG-07/MSG-10: what the composer has attached, with its name. */
export interface AttachedObject {
	kind: 'ROUTINE' | 'WORKOUT'
	id: string
	name: string
}

type MessageComposerProps = {
	/** Resolves when the message was sent; the draft is kept if it throws. */
	onSend: (content: SendMessageRequest) => Promise<unknown>
	isSending: boolean
	autoFocus?: boolean
	/** MSG-07/MSG-10: an object to open with, from "Send in a message". */
	initialAttachment?: AttachedObject | null
}

/**
 * MSG-01: the one field a conversation writes with. Its count is the
 * server's own rule (code points after trimming), so a draft the composer
 * would send is one the server accepts. Send is the region's one filled
 * control (§4.3 rule 1).
 *
 * MSG-07/MSG-10: one of the member's own routines or finished workouts can
 * travel with the message, beside which the text is an optional note.
 * Attaching is a ghost control, and what is attached sits above the field
 * until it is sent or removed.
 */
export function MessageComposer({
	onSend,
	isSending,
	autoFocus = false,
	initialAttachment = null,
}: MessageComposerProps) {
	const t = useTranslations('messaging.composer')
	const [draft, setDraft] = useState('')
	const [attached, setAttached] = useState<AttachedObject | null>(
		initialAttachment,
	)
	const [picking, setPicking] = useState(false)
	const [coarse, setCoarse] = useState(false)
	const hintId = useId()
	const state = composerState(draft, attached)

	// An object handed in once its name has loaded.
	const handed = initialAttachment?.id
	useEffect(() => {
		if (initialAttachment) setAttached(initialAttachment)
		// eslint-disable-next-line react-hooks/exhaustive-deps -- once per object handed in
	}, [handed])

	useEffect(() => {
		try {
			setCoarse(window.matchMedia('(pointer: coarse)').matches)
		} catch {
			setCoarse(false)
		}
	}, [])

	const submit = async () => {
		if (!state.sendable || isSending) return
		try {
			await onSend(state.sendable)
			setDraft('')
			setAttached(null)
		} catch {
			// The caller reports the refusal; the draft stays to retry.
		}
	}

	const AttachedIcon = attached?.kind === 'WORKOUT' ? Dumbbell : ClipboardList

	return (
		<form
			className="space-y-2"
			onSubmit={event => {
				event.preventDefault()
				void submit()
			}}
		>
			{attached ? (
				<div className="flex items-center justify-between gap-2 border border-rule px-3 py-2">
					<p className="type-body-sm flex min-w-0 items-center gap-2 text-foreground">
						<AttachedIcon className="size-4 shrink-0 text-ink-3" aria-hidden />
						<span className="truncate">
							{attached.kind === 'WORKOUT'
								? t('attachedWorkout', { name: attached.name })
								: t('attachedRoutine', { name: attached.name })}
						</span>
					</p>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="shrink-0"
						aria-label={t('removeAttachment', { name: attached.name })}
						disabled={isSending}
						onClick={() => setAttached(null)}
					>
						<X className="size-4" aria-hidden />
					</Button>
				</div>
			) : null}
			<Textarea
				aria-label={t('label')}
				aria-describedby={hintId}
				aria-invalid={state.over || undefined}
				placeholder={attached ? t('notePlaceholder') : t('placeholder')}
				value={draft}
				rows={3}
				autoFocus={autoFocus}
				className="min-h-24 resize-y"
				onChange={event => setDraft(event.target.value)}
				onKeyDown={event => {
					if (enterSends(event.nativeEvent, coarse)) {
						event.preventDefault()
						void submit()
					}
				}}
			/>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex min-w-0 flex-wrap items-center gap-x-2">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						disabled={isSending}
						onClick={() => setPicking(true)}
					>
						<Paperclip className="size-4" aria-hidden />
						{t('attach')}
					</Button>
					<p
						id={hintId}
						className={cn(
							'type-body-sm tabular-nums',
							state.over ? 'text-destructive' : 'text-ink-3',
						)}
					>
						{state.over
							? t('tooLong', { count: state.length, max: MESSAGE_BODY_MAX })
							: t('count', { count: state.length, max: MESSAGE_BODY_MAX })}
						{coarse ? null : (
							<span className="hidden sm:inline"> · {t('keyboardHint')}</span>
						)}
					</p>
				</div>
				<Button type="submit" disabled={!state.sendable || isSending}>
					{isSending ? (
						<Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
					) : (
						<Send className="mr-2 size-4" aria-hidden />
					)}
					{isSending ? t('sending') : t('send')}
				</Button>
			</div>
			<AttachPicker
				open={picking}
				onOpenChange={setPicking}
				onChoose={chosen => {
					setAttached(chosen)
					setPicking(false)
				}}
			/>
		</form>
	)
}
