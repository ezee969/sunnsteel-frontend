'use client'

import type { PublicUserProfile } from '@sunsteel/contracts'
import { Flag, MoreHorizontal, ShieldBan, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/toast'
import { ReportDialog } from '@/features/profile/report-dialog'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useBlockMember, useUnblockMember } from '@/lib/api/hooks/useModeration'

/**
 * PROF-10 on a member profile. Blocking is destructive enough to confirm and
 * to explain first: it is symmetric, it removes the follows, and it cannot
 * withdraw a link that was already shared. Saying only "you won't see them"
 * would leave two of those three unsaid.
 */
export function MemberModerationMenu({
	profile,
}: {
	profile: PublicUserProfile
}) {
	const errorText = useApiErrorMessage()
	const t = useTranslations('social.memberModeration')
	const tModeration = useTranslations('social.moderation')
	const router = useRouter()
	const { push } = useToast()
	const block = useBlockMember()
	const unblock = useUnblockMember()
	const [confirming, setConfirming] = useState(false)
	const [reporting, setReporting] = useState(false)
	const isBlocked = profile.moderation?.isBlocked ?? false
	const handle = profile.username

	const run = () => {
		const mutation = isBlocked ? unblock : block
		mutation.mutate(handle, {
			onSuccess: () => {
				setConfirming(false)
				push({
					title: isBlocked ? t('unblocked') : t('blocked'),
					description: isBlocked
						? t('unblockedBody', { handle })
						: t('blockedBody', { handle }),
					variant: 'success',
				})
				// A blocked profile answers 404 from here on, so staying on it
				// would show an error page the viewer just caused.
				if (!isBlocked) router.push('/search')
			},
			onError: error => {
				push({
					title: isBlocked ? t('unblockFailed') : t('blockFailed'),
					description: errorText(error),
					variant: 'destructive',
				})
			},
		})
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="sm" aria-label={t('moreActions')}>
						<MoreHorizontal className="h-4 w-4" aria-hidden />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onSelect={() => setConfirming(true)}>
						{isBlocked ? (
							<>
								<ShieldCheck className="mr-2 h-4 w-4" aria-hidden />{' '}
								{t('unblock')}
							</>
						) : (
							<>
								<ShieldBan className="mr-2 h-4 w-4" aria-hidden /> {t('block')}
							</>
						)}
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => setReporting(true)}>
						<Flag className="mr-2 h-4 w-4" aria-hidden /> {t('report')}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog open={confirming} onOpenChange={setConfirming}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{isBlocked
								? t('unblockTitle', { handle })
								: t('blockTitle', { handle })}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{isBlocked
								? tModeration('unblockExplanation')
								: tModeration('blockExplanation')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					{!isBlocked ? (
						<p className="type-body-sm text-ink-3">
							{tModeration('blockLinkCaveat')}
						</p>
					) : null}
					<AlertDialogFooter>
						<AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
						<AlertDialogAction
							onClick={event => {
								event.preventDefault()
								run()
							}}
							disabled={block.isPending || unblock.isPending}
						>
							{isBlocked ? t('unblock') : t('block')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<ReportDialog
				open={reporting}
				onOpenChange={setReporting}
				subjectKind="MEMBER"
				subjectId={handle}
			/>
		</>
	)
}
