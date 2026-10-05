'use client'

import { MESSAGE_BODY_MAX } from '@sunsteel/contracts'
import { Loader2, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { composerState, enterSends } from '@/lib/utils/messages'

type MessageComposerProps = {
	/** Resolves when the message was sent; the draft is kept if it throws. */
	onSend: (body: string) => Promise<unknown>
	isSending: boolean
	autoFocus?: boolean
}

/**
 * MSG-01: the one field a conversation writes with. Its count is the
 * server's own rule (code points after trimming), so a draft the composer
 * would send is one the server accepts. Send is the region's one filled
 * control (§4.3 rule 1).
 */
export function MessageComposer({
	onSend,
	isSending,
	autoFocus = false,
}: MessageComposerProps) {
	const t = useTranslations('messaging.composer')
	const [draft, setDraft] = useState('')
	const [coarse, setCoarse] = useState(false)
	const hintId = useId()
	const state = composerState(draft)

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
			<Textarea
				aria-label={t('label')}
				aria-describedby={hintId}
				aria-invalid={state.over || undefined}
				placeholder={t('placeholder')}
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
				<Button type="submit" disabled={!state.sendable || isSending}>
					{isSending ? (
						<Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
					) : (
						<Send className="mr-2 size-4" aria-hidden />
					)}
					{isSending ? t('sending') : t('send')}
				</Button>
			</div>
		</form>
	)
}
