'use client'

import type { ProfileVisibility, RoutineVisibility } from '@sunsteel/contracts'
import { EyeOff, Link2, Share2, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { PrivacyCapNote } from '@/features/settings/privacy-cap-note'
import {
	useCreateRoutineShare,
	useRevokeRoutineShare,
	useRoutineShares,
	useSetRoutineVisibility,
} from '@/lib/api/hooks/useRoutineSharing'
import { ROUTINE_HIDDEN_BY_MODERATION } from '@/lib/utils/moderation'
import {
	describeVisibilityCap,
	routineLinkNote,
	routineShareUrl,
	routineVisibilityOptions,
} from '@/lib/utils/routine-sharing'

interface RoutineSharingProps {
	routineId: string
	visibility: RoutineVisibility
	/** The account-level PROF-06 routines rule, which caps the setting below. */
	accountRoutinesRule: ProfileVisibility
	/** TRUST-04: a moderator has hidden the routine from everyone but its owner. */
	isHiddenByModeration: boolean
}

/**
 * ROUT-04's owner surface. Two controls that do different things, said plainly
 * because confusing them is the way an owner shares more than they meant:
 * visibility decides who can find the routine, a link opens it for whoever
 * holds the link regardless.
 */
export function RoutineSharing({
	routineId,
	visibility,
	accountRoutinesRule,
	isHiddenByModeration,
}: RoutineSharingProps) {
	const { push } = useToast()
	const t = useTranslations('routines.sharing')
	const visibilityOptions = routineVisibilityOptions(t)
	const shares = useRoutineShares(routineId)
	const setVisibility = useSetRoutineVisibility(routineId)
	const createShare = useCreateRoutineShare(routineId)
	const revokeShare = useRevokeRoutineShare(routineId)
	const [copiedId, setCopiedId] = useState<string | null>(null)

	const cap = describeVisibilityCap(accountRoutinesRule, visibility, t)
	const origin = typeof window === 'undefined' ? '' : window.location.origin

	const copy = async (shareId: string, token: string) => {
		try {
			await navigator.clipboard.writeText(routineShareUrl(origin, token))
			setCopiedId(shareId)
			push({ title: t('linkCopied'), variant: 'success' })
		} catch {
			// Clipboard access can be refused outright; say so rather than
			// pretending the copy worked.
			push({
				title: t('couldNotCopy'),
				description: t('couldNotCopyDetail'),
				variant: 'destructive',
			})
		}
	}

	return (
		<section aria-labelledby="routine-sharing" className="space-y-4">
			<h2
				id="routine-sharing"
				className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground"
			>
				<Share2 className="h-4 w-4 text-ink-3" aria-hidden />
				{t('heading')}
			</h2>

			{/* TRUST-04: while a hide is in force, every control below describes
			    something that is reaching nobody. Saying so first is the whole
			    point -- a switch left reading "Public" with nothing behind it is
			    the failure this notice exists to prevent. */}
			{isHiddenByModeration ? (
				<p
					role="status"
					className="type-body-sm flex max-w-[68ch] items-start gap-2 border border-rule bg-surface p-3 text-ink-2"
				>
					<EyeOff className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
					{ROUTINE_HIDDEN_BY_MODERATION}
				</p>
			) : null}

			<div className="space-y-2 pt-1">
				<Label htmlFor="routine-visibility">{t('whoCanFind')}</Label>
				<NativeSelect
					id="routine-visibility"
					className="max-w-xs"
					value={visibility}
					disabled={setVisibility.isPending}
					onChange={event =>
						setVisibility.mutate(event.target.value as RoutineVisibility)
					}
				>
					{visibilityOptions.map(option => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</NativeSelect>
				<p className="type-body-sm max-w-[68ch] text-ink-3">
					{
						visibilityOptions.find(option => option.value === visibility)
							?.description
					}
				</p>
				{cap ? (
					<PrivacyCapNote
						role="status"
						text={cap}
						section="routines"
						className="type-body-sm max-w-[68ch] text-ink-2"
					/>
				) : null}
				{setVisibility.isError ? (
					<p role="alert" className="type-body-sm text-ink-2">
						{t('notSaved')}
					</p>
				) : null}
			</div>

			<div className="space-y-3 border-t border-rule pt-4">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<p className="type-panel text-foreground">{t('privateLinks')}</p>
					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={createShare.isPending}
						onClick={() => createShare.mutate()}
					>
						<Link2 className="size-4" aria-hidden />
						{createShare.isPending ? t('creating') : t('createLink')}
					</Button>
				</div>
				<p className="type-body-sm max-w-[68ch] text-ink-3">
					{routineLinkNote(t)}
				</p>

				{shares.isPending ? (
					<Skeleton className="h-12" />
				) : shares.data?.items.length ? (
					<ul className="border-t border-rule-faint">
						{shares.data.items.map(share => (
							<li
								key={share.id}
								className="rule-row flex flex-wrap items-center justify-between gap-2 py-3"
							>
								<span className="type-data min-w-0 truncate text-ink-2">
									{routineShareUrl(origin, share.token)}
								</span>
								<span className="flex gap-2">
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={() => void copy(share.id, share.token)}
									>
										{copiedId === share.id ? t('copied') : t('copy')}
									</Button>
									<Button
										type="button"
										size="sm"
										variant="outline"
										disabled={revokeShare.isPending}
										onClick={() => revokeShare.mutate(share.id)}
									>
										<Trash2 className="size-4" aria-hidden />
										{t('revoke')}
									</Button>
								</span>
							</li>
						))}
					</ul>
				) : (
					<p className="type-body-sm text-ink-3">{t('noLinks')}</p>
				)}
			</div>
		</section>
	)
}
