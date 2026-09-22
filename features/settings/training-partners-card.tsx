'use client'

import type { TrainingPartnership } from '@sunsteel/contracts'
import { Handshake, Loader2 } from 'lucide-react'
import Link from 'next/link'
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
import { TRAINING_PARTNER_PERMISSION_FIELDS } from '@/lib/utils/training-partners'

const memberName = (partnership: TrainingPartnership) =>
	[partnership.member.name, partnership.member.lastName]
		.filter(Boolean)
		.join(' ')

export function TrainingPartnersCard() {
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
						<h2 className="type-panel">Training Partners</h2>
					</CardTitle>
				</div>
				<CardDescription>
					A request shares nothing by itself. After acceptance, each of you
					chooses independently what the other may see. Private profile rules
					still stay private.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{partnerships.isPending ? (
					<div className="type-body-sm flex items-center justify-center gap-2 py-8 text-ink-3">
						<Loader2 className="size-4 animate-spin" aria-hidden />
						Loading training partners…
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
							Try Again
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
									Requests
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
									Active Partners
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
								No training partners yet. Open another member’s{' '}
								<Link
									href="/search"
									className="text-primary underline-offset-4 hover:underline"
								>
									profile
								</Link>{' '}
								to send a request.
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
					@{partnership.member.username} ·{' '}
					{partnership.requestedByMe ? 'request sent' : 'wants to partner'}
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
										title: 'Training partner added',
										description: `Choose what @${partnership.member.username} may see.`,
										variant: 'success',
									}),
								onError: error => showError(push, error),
							})
						}
					>
						Accept
					</Button>
				) : null}
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={busy}
					onClick={() =>
						remove.mutate(partnership.id, {
							onError: error => showError(push, error),
						})
					}
				>
					{partnership.requestedByMe ? 'Cancel Request' : 'Decline'}
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
	const [draft, setDraft] = useState(partnership.permissionsGrantedByMe)
	const update = useUpdateTrainingPartnerPermissions()
	const remove = useRemoveTrainingPartner()
	const { push } = useToast()
	const name = memberName(partnership)
	const changed = TRAINING_PARTNER_PERMISSION_FIELDS.some(
		field => draft[field.key] !== partnership.permissionsGrantedByMe[field.key],
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
						title: 'Partner access updated',
						description: `Your choices for @${partnership.member.username} are active.`,
						variant: 'success',
					}),
				onError: error => showError(push, error),
			},
		)
	}

	return (
		<div className="rule-row space-y-4 py-5">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<p className="type-panel text-foreground">{name}</p>
					<p className="type-body-sm text-ink-3">
						@{partnership.member.username} · their access to your data
					</p>
				</div>
				<Button asChild type="button" variant="ghost" size="sm">
					<Link
						href={`/profile/${encodeURIComponent(partnership.member.username)}`}
					>
						View Profile
					</Link>
				</Button>
			</div>

			<div className="divide-y divide-rule-faint border-y border-rule-faint">
				{TRAINING_PARTNER_PERMISSION_FIELDS.map(field => (
					<div
						key={field.key}
						className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-center"
					>
						<div className="space-y-1">
							<Label htmlFor={`${partnership.id}-${field.key}`}>
								{field.label}
							</Label>
							<p className="type-body-sm text-ink-3">{field.description}</p>
						</div>
						<Select
							value={draft[field.key] ? 'SHARE' : 'PRIVATE'}
							onValueChange={value =>
								setDraft(previous => ({
									...previous,
									[field.key]: value === 'SHARE',
								}))
							}
						>
							<SelectTrigger id={`${partnership.id}-${field.key}`}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="PRIVATE">Keep Private</SelectItem>
								<SelectItem value="SHARE">Share</SelectItem>
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
									title: 'Training partnership ended',
									description: `All partner access between you and @${partnership.member.username} was removed.`,
									variant: 'success',
								}),
							onError: error => showError(push, error),
						})
					}
				>
					End Partnership
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
					Save Access
				</Button>
			</div>
		</div>
	)
}

type ToastPush = ReturnType<typeof useToast>['push']

function showError(push: ToastPush, error: Error) {
	push({
		title: 'Could not update training partners',
		description: error.message,
		variant: 'destructive',
	})
}
