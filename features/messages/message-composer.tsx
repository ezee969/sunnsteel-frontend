'use client'

import { MESSAGE_BODY_MAX, type SendMessageRequest } from '@sunsteel/contracts'
import { ClipboardList, Loader2, Send, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { composerState, enterSends } from '@/lib/utils/messages'

import { RoutinePicker } from './routine-picker'

export interface AttachedRoutine {
	id: string
	name: string
}

type MessageComposerProps = {
	/** Resolves when the message was sent; the draft is kept if it throws. */
	onSend: (content: SendMessageRequest) => Promise<unknown>
	isSending: boolean
	autoFocus?: boolean
	/** MSG-07: a routine to open with, from "Send in a message". */
	initialRoutine?: AttachedRoutine | null
}

/**
 * MSG-01: the one field a conversation writes with. Its count is the
 * server's own rule (code points after trimming), so a draft the composer
 * would send is one the server accepts. Send is the region's one filled
 * control (§4.3 rule 1).
 *
 * MSG-07: one of the member's own routines can travel with the message,
 * beside which the text is an optional note. Attaching is a ghost control,
 * and the attached routine sits above the field until it is sent or removed.
 */
export function MessageComposer({
	onSend,
	isSending,
	autoFocus = false,
	initialRoutine = null,
}: MessageComposerProps) {
	const t = useTranslations('messaging.composer')
	const [draft, setDraft] = useState('')
	const [routine, setRoutine] = useState<AttachedRoutine | null>(initialRoutine)
	const [picking, setPicking] = useState(false)
	const [coarse, setCoarse] = useState(false)
	const hintId = useId()
	const state = composerState(draft, routine?.id ?? null)

	// A routine handed in once the member's routines have loaded.
	const handed = initialRoutine?.id
	useEffect(() => {
		if (initialRoutine) setRoutine(initialRoutine)
		// eslint-disable-next-line react-hooks/exhaustive-deps -- once per routine handed in
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
			setRoutine(null)
		} catch {
			// The caller reports the refusal; the draft stays to retry.
		}
	}

	return (
		<form
			className="space-y-2"
			onSubmit={event => {
				event.preventDefault()
				void submit()
			}}
		>
			{routine ? (
				<div className="flex items-center justify-between gap-2 border border-rule px-3 py-2">
					<p className="type-body-sm flex min-w-0 items-center gap-2 text-foreground">
						<ClipboardList className="size-4 shrink-0 text-ink-3" aria-hidden />
						<span className="truncate">
							{t('attachedRoutine', { name: routine.name })}
						</span>
					</p>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="shrink-0"
						aria-label={t('removeRoutine', { name: routine.name })}
						disabled={isSending}
						onClick={() => setRoutine(null)}
					>
						<X className="size-4" aria-hidden />
					</Button>
				</div>
			) : null}
			<Textarea
				aria-label={t('label')}
				aria-describedby={hintId}
				aria-invalid={state.over || undefined}
				placeholder={routine ? t('notePlaceholder') : t('placeholder')}
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
						<ClipboardList className="size-4" aria-hidden />
						{t('attachRoutine')}
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
			<RoutinePicker
				open={picking}
				onOpenChange={setPicking}
				onChoose={chosen => {
					setRoutine(chosen)
					setPicking(false)
				}}
			/>
		</form>
	)
}
