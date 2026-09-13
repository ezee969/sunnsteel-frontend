'use client'

import type { SessionShare, SessionShareField } from '@sunsteel/contracts'
import {
	SESSION_SHARE_DEFAULT_FIELDS,
	SESSION_SHARE_FIELDS,
	SESSION_SHARE_MAX_ACTIVE_LINKS,
} from '@sunsteel/contracts'
import { Copy, Link2Off, Share2 } from 'lucide-react'
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
import { copyTextToClipboard } from '@/lib/utils/profile-sharing'
import {
	describeShareFields,
	getSharedSessionUrl,
	SESSION_SHARE_FIELD_COPY,
	toggleShareField,
} from '@/lib/utils/session-share'

/**
 * SOC-07: the owner chooses which parts of a completed session's recap a
 * public link reveals, and can revoke any link. Notes and progression are
 * opt-in; the previous-session comparison is never shared.
 */
export function SessionShareButton({ sessionId }: { sessionId: string }) {
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
				title: 'Link copied',
				description: 'Anyone with this link can see the parts you chose.',
				variant: 'success',
			})
		} catch {
			push({
				title: 'Could not copy link',
				description: 'Check your browser permissions and try again.',
				variant: 'destructive',
			})
		}
	}

	const onCreate = () => {
		create.mutate(fields, {
			onSuccess: share => void copyLink(share),
			onError: error =>
				push({
					title: 'Could not create link',
					description: error.message,
					variant: 'destructive',
				}),
		})
	}

	const onRevoke = (share: SessionShare) => {
		revoke.mutate(share.id, {
			onSuccess: () =>
				push({
					title: 'Link revoked',
					description: 'It no longer opens this session.',
					variant: 'success',
				}),
			onError: error =>
				push({
					title: 'Could not revoke link',
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
				Share
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Share this session</DialogTitle>
						<DialogDescription>
							Anyone with the link can see the parts you choose, even without an
							account. You can revoke a link at any time.
						</DialogDescription>
					</DialogHeader>

					<fieldset>
						<legend className="type-label text-ink-3">Include</legend>
						<div className="divide-y divide-rule">
							{SESSION_SHARE_FIELDS.map(field => {
								const id = `share-field-${field}`
								return (
									<div
										key={field}
										className="grid min-h-14 grid-cols-[minmax(0,1fr)_44px] items-center gap-3 py-3"
									>
										<div className="space-y-1">
											<Label htmlFor={id}>
												{SESSION_SHARE_FIELD_COPY[field].label}
											</Label>
											<p className="type-body-sm text-ink-3">
												{SESSION_SHARE_FIELD_COPY[field].description}
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
												aria-label={SESSION_SHARE_FIELD_COPY[field].label}
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
							Active links
						</h3>
						{shares.isPending ? (
							<p className="type-body-sm py-2 text-ink-3">Loading links…</p>
						) : shares.isError ? (
							<p role="alert" className="type-body-sm py-2 text-ink-3">
								Could not load your links. Close and reopen to try again.
							</p>
						) : activeLinks.length === 0 ? (
							<p className="type-body-sm py-2 text-ink-3">
								No active links for this session.
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
												{describeShareFields(share.fields)}
											</p>
											<p className="type-body-sm text-ink-3">
												Created {formatTimeAgo(share.createdAt)}
											</p>
										</div>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => void copyLink(share)}
										>
											<Copy aria-hidden />
											Copy
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
											Revoke
										</Button>
									</li>
								))}
							</ul>
						)}
						{atLimit ? (
							<p className="type-body-sm text-ink-3">
								This session has {SESSION_SHARE_MAX_ACTIVE_LINKS} active links.
								Revoke one to create another.
							</p>
						) : null}
					</section>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							Close
						</Button>
						<Button
							type="button"
							onClick={onCreate}
							disabled={fields.length === 0 || create.isPending || atLimit}
						>
							{create.isPending ? 'Creating…' : 'Create and copy link'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
