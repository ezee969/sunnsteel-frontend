'use client'

import type { TrainingPartnership } from '@sunsteel/contracts'
import { Handshake, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import {
	useAcceptTrainingPartner,
	useRemoveTrainingPartner,
	useTrainingPartners,
	useUpdateTrainingPartnerPermissions,
} from '@/lib/api/hooks/useTrainingPartners'
import { TRAINING_PARTNER_PERMISSION_KEYS } from '@/lib/utils/training-partners'

const memberName = (partnership: TrainingPartnership) =>
	[partnership.member.name, partnership.member.lastName]
		.filter(Boolean)
		.join(' ')

export function TrainingPartnersCard() {
	const t = useTranslations('settings.trainingPartners')
	const partnerships = useTrainingPartners()
	const items = partnerships.data?.items ?? []
	const pending = items.filter(item => item.status === 'PENDING')
	const active = items.filter(item => item.status === 'ACTIVE')

	return (
		<Card id="training-partners" className="scroll-mt-24">
			<CardHeader>
				<div className="flex items-center gap-2">
					<Handshake className="size-5 text-ink-3" aria-hidden />
					<CardTitle>
						<h2 className="type-panel">{t('title')}</h2>
					</CardTitle>
				</div>
				<CardDescription>{t('description')}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{partnerships.isPending ? (
					<div className="type-body-sm flex items-center justify-center gap-2 py-8 text-ink-3">
						<Loader2 className="size-4 animate-spin" aria-hidden />
						{t('loading')}
					</div>
				) : partnerships.isError ? (
					<div
						role="alert"
						className="border border-destructive bg-surface p-4"
					>
						<p className="type-body-sm text-destructive">
							{partnerships.error.message}
						</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="mt-3"
							onClick={() => void partnerships.refetch()}
						>
							{t('tryAgain')}
						</Button>
					</div>
				) : (
					<>
						{pending.length ? (
							<section aria-labelledby="partner-requests-heading">
								<h3
									id="partner-requests-heading"
									className="type-panel text-foreground"
								>
									{t('requests')}
								</h3>
								<div className="mt-2 border-t border-rule-faint">
									{pending.map(partnership => (
										<PendingPartnerRow
											key={partnership.id}
											partnership={partnership}
										/>
									))}
								</div>
							</section>
						) : null}

						{active.length ? (
							<section aria-labelledby="active-partners-heading">
								<h3
									id="active-partners-heading"
									className="type-panel text-foreground"
								>
									{t('activePartners')}
								</h3>
								<div className="mt-2 border-t border-rule-faint">
									{active.map(partnership => (
										<ActivePartnerRow
											key={partnership.id}
											partnership={partnership}
										/>
									))}
								</div>
							</section>
						) : null}

						{items.length === 0 ? (
							<p className="type-body-sm text-ink-3">
								{t.rich('empty', {
									link: chunks => (
										<Link
											href="/search"
											className="text-primary underline-offset-4 hover:underline"
										>
											{chunks}
										</Link>
									),
								})}
							</p>
						) : null}
					</>
				)}
			</CardContent>
		</Card>
	)
}

function PendingPartnerRow({
	partnership,
}: {
	partnership: TrainingPartnership
}) {
	const t = useTranslations('settings.trainingPartners')
	const accept = useAcceptTrainingPartner()
	const remove = useRemoveTrainingPartner()
	const { push } = useToast()
	const busy = accept.isPending || remove.isPending
	const name = memberName(partnership)

	return (
		<div className="rule-row flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="min-w-0">
				<p className="type-panel text-foreground">{name}</p>
				<p className="type-body-sm text-ink-3">
					{t(
						partnership.requestedByMe
							? 'pendingLine.sent'
							: 'pendingLine.received',
						{
							username: partnership.member.username,
						},
					)}
				</p>
			</div>
			<div className="flex flex-wrap gap-2">
				{!partnership.requestedByMe ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={busy}
						onClick={() =>
							accept.mutate(partnership.id, {
								onSuccess: () =>
									push({
										title: t('addedTitle'),
										description: t('addedDescription', {
											username: partnership.member.username,
										}),
										variant: 'success',
									}),
								onError: error => showError(push, t('errorTitle'), error),
							})
						}
					>
						{t('accept')}
					</Button>
				) : null}
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={busy}
					onClick={() =>
						remove.mutate(partnership.id, {
							onError: error => showError(push, t('errorTitle'), error),
						})
					}
				>
					{partnership.requestedByMe ? t('cancelRequest') : t('decline')}
				</Button>
			</div>
		</div>
	)
}

function ActivePartnerRow({
	partnership,
}: {
	partnership: TrainingPartnership
}) {
	const t = useTranslations('settings.trainingPartners')
	const [draft, setDraft] = useState(partnership.permissionsGrantedByMe)
	const update = useUpdateTrainingPartnerPermissions()
	const remove = useRemoveTrainingPartner()
	const { push } = useToast()
	const name = memberName(partnership)
	const changed = TRAINING_PARTNER_PERMISSION_KEYS.some(
		key => draft[key] !== partnership.permissionsGrantedByMe[key],
	)

	useEffect(() => {
		setDraft(partnership.permissionsGrantedByMe)
	}, [partnership.permissionsGrantedByMe])

	const save = () => {
		update.mutate(
			{ partnershipId: partnership.id, permissions: draft },
			{
				onSuccess: () =>
					push({
						title: t('accessUpdatedTitle'),
						description: t('accessUpdatedDescription', {
							username: partnership.member.username,
						}),
						variant: 'success',
					}),
				onError: error => showError(push, t('errorTitle'), error),
			},
		)
	}

	return (
		<div className="rule-row space-y-4 py-5">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<p className="type-panel text-foreground">{name}</p>
					<p className="type-body-sm text-ink-3">
						{t('activeLine', { username: partnership.member.username })}
					</p>
				</div>
				<Button asChild type="button" variant="ghost" size="sm">
					<Link
						href={`/profile/${encodeURIComponent(partnership.member.username)}`}
					>
						{t('viewProfile')}
					</Link>
				</Button>
			</div>

			<div className="divide-y divide-rule-faint border-y border-rule-faint">
				{TRAINING_PARTNER_PERMISSION_KEYS.map(key => (
					<div
						key={key}
						className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-center"
					>
						<div className="space-y-1">
							<Label htmlFor={`${partnership.id}-${key}`}>
								{t(`permission.${key}.label`)}
							</Label>
							<p className="type-body-sm text-ink-3">
								{t(`permission.${key}.description`)}
							</p>
						</div>
						<Select
							value={draft[key] ? 'SHARE' : 'PRIVATE'}
							onValueChange={value =>
								setDraft(previous => ({
									...previous,
									[key]: value === 'SHARE',
								}))
							}
						>
							<SelectTrigger id={`${partnership.id}-${key}`}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="PRIVATE">{t('keepPrivate')}</SelectItem>
								<SelectItem value="SHARE">{t('share')}</SelectItem>
							</SelectContent>
						</Select>
					</div>
				))}
			</div>

			<div className="flex flex-wrap justify-end gap-2">
				<Button
					type="button"
					variant="destructive"
					size="sm"
					disabled={update.isPending || remove.isPending}
					onClick={() =>
						remove.mutate(partnership.id, {
							onSuccess: () =>
								push({
									title: t('endedTitle'),
									description: t('endedDescription', {
										username: partnership.member.username,
									}),
									variant: 'success',
								}),
							onError: error => showError(push, t('errorTitle'), error),
						})
					}
				>
					{t('end')}
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={!changed || update.isPending || remove.isPending}
					onClick={save}
				>
					{update.isPending ? (
						<Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
					) : null}
					{t('save')}
				</Button>
			</div>
		</div>
	)
}

type ToastPush = ReturnType<typeof useToast>['push']

function showError(push: ToastPush, title: string, error: Error) {
	push({
		title,
		description: error.message,
		variant: 'destructive',
	})
}
