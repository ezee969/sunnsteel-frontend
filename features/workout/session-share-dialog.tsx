'use client'

import type { SessionShare, SessionShareField } from '@sunsteel/contracts'
import {
	SESSION_SHARE_DEFAULT_FIELDS,
	SESSION_SHARE_FIELDS,
	SESSION_SHARE_MAX_ACTIVE_LINKS,
} from '@sunsteel/contracts'
import { Copy, Link2Off, Share2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import {
	useCreateSessionShare,
	useRevokeSessionShare,
	useSessionShares,
} from '@/lib/api/hooks/useSessionShares'
import { formatTimeAgo } from '@/lib/utils/date'
import { SESSION_SHARE_HIDDEN_BY_MODERATION } from '@/lib/utils/moderation'
import { copyTextToClipboard } from '@/lib/utils/profile-sharing'
import {
	describeShareFields,
	getSharedSessionUrl,
	sessionShareFieldDescription,
	sessionShareFieldLabel,
	toggleShareField,
} from '@/lib/utils/session-share'

/**
 * SOC-07: the owner chooses which parts of a completed session's recap a
 * public link reveals, and can revoke any link. Notes and progression are
 * opt-in; the previous-session comparison is never shared.
 */
export function SessionShareButton({ sessionId }: { sessionId: string }) {
	const t = useTranslations('workout.share')
	const [open, setOpen] = useState(false)
	const [fields, setFields] = useState<SessionShareField[]>(
		SESSION_SHARE_DEFAULT_FIELDS,
	)
	const shares = useSessionShares(sessionId, open)
	const create = useCreateSessionShare(sessionId)
	const revoke = useRevokeSessionShare(sessionId)
	const { push } = useToast()
	const activeLinks = shares.data?.items ?? []
	const atLimit = activeLinks.length >= SESSION_SHARE_MAX_ACTIVE_LINKS

	const copyLink = async (share: SessionShare) => {
		try {
			await copyTextToClipboard(
				getSharedSessionUrl(share.token, window.location.origin),
			)
			push({
				title: t('linkCopiedTitle'),
				description: t('linkCopiedDescription'),
				variant: 'success',
			})
		} catch {
			push({
				title: t('couldNotCopyTitle'),
				description: t('couldNotCopyDescription'),
				variant: 'destructive',
			})
		}
	}

	const onCreate = () => {
		create.mutate(fields, {
			onSuccess: share => void copyLink(share),
			onError: error =>
				push({
					title: t('couldNotCreateTitle'),
					description: error.message,
					variant: 'destructive',
				}),
		})
	}

	const onRevoke = (share: SessionShare) => {
		revoke.mutate(share.id, {
			onSuccess: () =>
				push({
					title: t('linkRevokedTitle'),
					description: t('linkRevokedDescription'),
					variant: 'success',
				}),
			onError: error =>
				push({
					title: t('couldNotRevokeTitle'),
					description: error.message,
					variant: 'destructive',
				}),
		})
	}

	return (
		<>
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => setOpen(true)}
			>
				<Share2 aria-hidden />
				{t('shareButton')}
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t('dialogTitle')}</DialogTitle>
						<DialogDescription>{t('dialogDescription')}</DialogDescription>
					</DialogHeader>

					<fieldset>
						<legend className="type-label text-ink-3">
							{t('includeLegend')}
						</legend>
						<div className="divide-y divide-rule">
							{SESSION_SHARE_FIELDS.map(field => {
								const id = `share-field-${field}`
								const label = sessionShareFieldLabel(field, t)
								return (
									<div
										key={field}
										className="grid min-h-14 grid-cols-[minmax(0,1fr)_44px] items-center gap-3 py-3"
									>
										<div className="space-y-1">
											<Label htmlFor={id}>{label}</Label>
											<p className="type-body-sm text-ink-3">
												{sessionShareFieldDescription(field, t)}
											</p>
										</div>
										<Label
											htmlFor={id}
											className="flex size-11 cursor-pointer items-center justify-center"
										>
											<Checkbox
												id={id}
												checked={fields.includes(field)}
												onCheckedChange={checked =>
													setFields(current =>
														toggleShareField(current, field, checked === true),
													)
												}
												aria-label={label}
												className="size-5"
											/>
										</Label>
									</div>
								)
							})}
						</div>
					</fieldset>

					<section aria-labelledby="active-share-links" className="space-y-1">
						<h3 id="active-share-links" className="type-panel text-foreground">
							{t('activeLinksHeading')}
						</h3>
						{shares.isPending ? (
							<p className="type-body-sm py-2 text-ink-3">
								{t('loadingLinks')}
							</p>
						) : shares.isError ? (
							<p role="alert" className="type-body-sm py-2 text-ink-3">
								{t('loadLinksError')}
							</p>
						) : activeLinks.length === 0 ? (
							<p className="type-body-sm py-2 text-ink-3">
								{t('noActiveLinks')}
							</p>
						) : (
							<ul>
								{activeLinks.map(share => (
									<li
										key={share.id}
										className="rule-row flex flex-wrap items-center gap-2 py-3"
									>
										<div className="min-w-0 flex-1 basis-40">
											<p className="type-body-sm text-foreground">
												{describeShareFields(share.fields, t)}
											</p>
											<p className="type-body-sm text-ink-3">
												{t('createdAgo', {
													time: formatTimeAgo(share.createdAt),
												})}
											</p>
											{/* TRUST-04: the link is still active and still
											    copyable, but it opens for nobody while the hide
											    is in force. An owner who was not told would
											    read that as the link being broken. */}
											{share.isHiddenByModeration ? (
												<p className="type-body-sm text-ink-2">
													{SESSION_SHARE_HIDDEN_BY_MODERATION}
												</p>
											) : null}
										</div>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => void copyLink(share)}
										>
											<Copy aria-hidden />
											{t('copy')}
										</Button>
										{/* A revoked link cannot be restored, so revoking is a
										    destruction and wears the destructive outline
										    (§4.3 rule 5). */}
										<Button
											type="button"
											variant="destructive"
											size="sm"
											onClick={() => onRevoke(share)}
											disabled={revoke.isPending}
										>
											<Link2Off aria-hidden />
											{t('revoke')}
										</Button>
									</li>
								))}
							</ul>
						)}
						{atLimit ? (
							<p className="type-body-sm text-ink-3">
								{t('atLimit', { count: SESSION_SHARE_MAX_ACTIVE_LINKS })}
							</p>
						) : null}
					</section>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							{t('close')}
						</Button>
						<Button
							type="button"
							onClick={onCreate}
							disabled={fields.length === 0 || create.isPending || atLimit}
						>
							{create.isPending ? t('creating') : t('createAndCopy')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
