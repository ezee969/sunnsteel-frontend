'use client'

import type { UserSearchResponse } from '@sunsteel/contracts'
import { Handshake, HeartHandshake, Loader2, UserRoundPlus } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/toast'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import {
	useAcceptTrainingPartner,
	useRequestTrainingPartner,
	useSendTrainingPartnerEncouragement,
	useTrainingPartners,
} from '@/lib/api/hooks/useTrainingPartners'
import {
	findTrainingPartnership,
	trainingPartnerActionLabel,
	trainingPartnerEncouragementOptions,
} from '@/lib/utils/training-partners'

export function TrainingPartnerAction({
	member,
}: {
	member: UserSearchResponse
}) {
	const errorText = useApiErrorMessage()
	const t = useTranslations('social.partnerAction')
	const tPartners = useTranslations('settings.trainingPartners')
	const partnerships = useTrainingPartners()
	const request = useRequestTrainingPartner()
	const accept = useAcceptTrainingPartner()
	const encourage = useSendTrainingPartnerEncouragement()
	const { push } = useToast()
	const partnership = findTrainingPartnership(
		partnerships.data?.items ?? [],
		member.id,
	)
	const label = trainingPartnerActionLabel(tPartners, partnership)
	const pending = request.isPending || accept.isPending
	if (partnerships.isError) {
		return (
			<Button type="button" variant="outline" size="sm" disabled>
				<Handshake className="mr-2 size-4" aria-hidden />
				{t('unavailable')}
			</Button>
		)
	}

	if (partnership?.status === 'ACTIVE') {
		return (
			<>
				{partnership.permissionsGrantedToMe.encouragement ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={encourage.isPending}
							>
								{encourage.isPending ? (
									<Loader2 className="size-4 animate-spin" aria-hidden />
								) : (
									<HeartHandshake className="size-4" aria-hidden />
								)}
								{t('sendEncouragement')}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>{t('choosePrompt')}</DropdownMenuLabel>
							{trainingPartnerEncouragementOptions(tPartners).map(option => (
								<DropdownMenuItem
									key={option.kind}
									onSelect={() =>
										encourage.mutate(
											{ partnershipId: partnership.id, kind: option.kind },
											{
												onSuccess: () =>
													push({
														title: t('encouragementSent'),
														description: t('encouragementSentBody', {
															prompt: option.label,
															username: member.username,
														}),
														variant: 'success',
													}),
												onError: error =>
													push({
														title: t('encouragementFailed'),
														description: errorText(error),
														variant: 'destructive',
													}),
											},
										)
									}
								>
									{option.label}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				) : null}
				<Button asChild variant="outline" size="sm">
					<Link href="/settings/privacy#training-partners">
						<Handshake className="mr-2 size-4" aria-hidden />
						{label}
					</Link>
				</Button>
			</>
		)
	}

	const act = () => {
		const mutation = partnership ? accept : request
		const variable = partnership ? partnership.id : member.username
		mutation.mutate(variable, {
			onSuccess: () =>
				push({
					title: partnership ? t('partnerAdded') : t('requestSent'),
					description: partnership
						? t('partnerAddedBody', { username: member.username })
						: t('requestSentBody', { username: member.username }),
					variant: 'success',
				}),
			onError: error =>
				push({
					title: t('updateFailed'),
					description: errorText(error),
					variant: 'destructive',
				}),
		})
	}

	return (
		<Button
			type="button"
			variant="outline"
			size="sm"
			disabled={
				partnerships.isPending || pending || partnership?.requestedByMe === true
			}
			onClick={act}
		>
			{pending ? (
				<Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
			) : (
				<UserRoundPlus className="mr-2 size-4" aria-hidden />
			)}
			{label}
		</Button>
	)
}
