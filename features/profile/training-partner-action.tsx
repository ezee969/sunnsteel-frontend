'use client'

import type { UserSearchResponse } from '@sunsteel/contracts'
import { Handshake, HeartHandshake, Loader2, UserRoundPlus } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/toast'
import {
	useAcceptTrainingPartner,
	useRequestTrainingPartner,
	useSendTrainingPartnerEncouragement,
	useTrainingPartners,
} from '@/lib/api/hooks/useTrainingPartners'
import {
	findTrainingPartnership,
	TRAINING_PARTNER_ENCOURAGEMENT_OPTIONS,
	trainingPartnerActionLabel,
} from '@/lib/utils/training-partners'

export function TrainingPartnerAction({
	member,
}: {
	member: UserSearchResponse
}) {
	const partnerships = useTrainingPartners()
	const request = useRequestTrainingPartner()
	const accept = useAcceptTrainingPartner()
	const encourage = useSendTrainingPartnerEncouragement()
	const { push } = useToast()
	const partnership = findTrainingPartnership(
		partnerships.data?.items ?? [],
		member.id,
	)
	const label = trainingPartnerActionLabel(partnership)
	const pending = request.isPending || accept.isPending
	if (partnerships.isError) {
		return (
			<Button type="button" variant="outline" size="sm" disabled>
				<Handshake className="mr-2 size-4" aria-hidden />
				Partner Status Unavailable
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
								Send Encouragement
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Choose a prompt</DropdownMenuLabel>
							{TRAINING_PARTNER_ENCOURAGEMENT_OPTIONS.map(option => (
								<DropdownMenuItem
									key={option.kind}
									onSelect={() =>
										encourage.mutate(
											{ partnershipId: partnership.id, kind: option.kind },
											{
												onSuccess: () =>
													push({
														title: 'Encouragement sent',
														description: `“${option.label}” was sent to @${member.username}.`,
														variant: 'success',
													}),
												onError: error =>
													push({
														title: 'Could not send encouragement',
														description: error.message,
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
					<Link href="/settings#training-partners">
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
					title: partnership ? 'Training partner added' : 'Request sent',
					description: partnership
						? `You and @${member.username} can now choose what to share.`
						: `@${member.username} must accept before either of you shares anything.`,
					variant: 'success',
				}),
			onError: error =>
				push({
					title: 'Could not update training partners',
					description: error.message,
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
