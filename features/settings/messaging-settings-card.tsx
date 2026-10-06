'use client'

import {
	DEFAULT_MESSAGE_PERMISSION,
	isMessagePermission,
	type UserProfile,
} from '@sunsteel/contracts'
import { Loader2, MessageSquare } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { useToast } from '@/components/ui/toast'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useUpdateMessagePermission } from '@/lib/api/hooks/useConversations'

/**
 * MSG-01: who may start a conversation with the member. It decides only new
 * conversations; the card says so, and that blocking is the control for an
 * existing one (owner, 2026-10-05). It also states plainly that messages are
 * not end-to-end encrypted. `MSG-02` adds Everyone, as requests.
 */
export function MessagingSettingsCard({ profile }: { profile: UserProfile }) {
	const t = useTranslations('messaging.settings')
	const tCommon = useTranslations('messaging.common')
	const errorText = useApiErrorMessage()
	const { push } = useToast()
	const update = useUpdateMessagePermission()
	const current = isMessagePermission(profile.messagePermission)
		? profile.messagePermission
		: DEFAULT_MESSAGE_PERMISSION

	const choose = (value: string) => {
		if (!isMessagePermission(value) || value === current) return
		update.mutate(value, {
			onError: error =>
				push({
					title: t('saveFailed'),
					description: errorText(error),
					variant: 'destructive',
				}),
		})
	}

	return (
		<Card id="messages" className="scroll-mt-24">
			<CardHeader>
				<div className="flex items-center gap-2">
					<MessageSquare className="h-5 w-5 text-primary" aria-hidden />
					<CardTitle>{t('title')}</CardTitle>
				</div>
				<CardDescription>{t('description')}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="message-permission">{t('legend')}</Label>
					<div className="flex items-center gap-2">
						<NativeSelect
							id="message-permission"
							className="w-full sm:max-w-sm"
							value={current}
							disabled={update.isPending}
							onChange={event => choose(event.target.value)}
							aria-describedby="message-permission-hint"
						>
							<option value="FOLLOWED">{t('followed')}</option>
							<option value="EVERYONE">{t('everyone')}</option>
							<option value="NOBODY">{t('nobody')}</option>
						</NativeSelect>
						{update.isPending ? (
							<Loader2
								className="size-4 shrink-0 animate-spin text-ink-3"
								aria-hidden
							/>
						) : null}
					</div>
					<p
						id="message-permission-hint"
						className="type-body-sm max-w-[68ch] text-ink-3"
					>
						{current === 'NOBODY'
							? t('nobodyHint')
							: current === 'EVERYONE'
								? t('everyoneHint')
								: t('followedHint')}
					</p>
				</div>
				<p className="type-body-sm max-w-[68ch] text-ink-2">
					{t('existingNote')}
				</p>
				<p className="type-body-sm max-w-[68ch] text-ink-3">
					{tCommon('encryption')}
				</p>
			</CardContent>
		</Card>
	)
}
