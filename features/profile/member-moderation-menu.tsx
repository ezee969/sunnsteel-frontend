'use client'

import type { PublicUserProfile } from '@sunsteel/contracts'
import { Flag, MoreHorizontal, ShieldBan, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
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
import { useBlockMember, useUnblockMember } from '@/lib/api/hooks/useModeration'
import {
	BLOCK_EXPLANATION,
	BLOCK_LINK_CAVEAT,
	UNBLOCK_EXPLANATION,
} from '@/lib/utils/moderation'

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
					title: isBlocked ? 'Member unblocked' : 'Member blocked',
					description: isBlocked
						? `@${handle} can find and follow you again.`
						: `You and @${handle} no longer see each other.`,
					variant: 'success',
				})
				// A blocked profile answers 404 from here on, so staying on it
				// would show an error page the viewer just caused.
				if (!isBlocked) router.push('/search')
			},
			onError: error => {
				push({
					title: isBlocked
						? 'Could not unblock this member'
						: 'Could not block this member',
					description: error.message,
					variant: 'destructive',
				})
			},
		})
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="sm" aria-label="More actions">
						<MoreHorizontal className="h-4 w-4" aria-hidden />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onSelect={() => setConfirming(true)}>
						{isBlocked ? (
							<>
								<ShieldCheck className="mr-2 h-4 w-4" aria-hidden /> Unblock
							</>
						) : (
							<>
								<ShieldBan className="mr-2 h-4 w-4" aria-hidden /> Block
							</>
						)}
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => setReporting(true)}>
						<Flag className="mr-2 h-4 w-4" aria-hidden /> Report
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog open={confirming} onOpenChange={setConfirming}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{isBlocked ? `Unblock @${handle}?` : `Block @${handle}?`}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{isBlocked ? UNBLOCK_EXPLANATION : BLOCK_EXPLANATION}
						</AlertDialogDescription>
					</AlertDialogHeader>
					{!isBlocked ? (
						<p className="type-body-sm text-ink-3">{BLOCK_LINK_CAVEAT}</p>
					) : null}
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={event => {
								event.preventDefault()
								run()
							}}
							disabled={block.isPending || unblock.isPending}
						>
							{isBlocked ? 'Unblock' : 'Block'}
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
