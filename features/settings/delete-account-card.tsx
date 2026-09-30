'use client'

import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useDeleteAccount } from '@/lib/api/hooks/useDeleteAccount'
import {
	accountDeletionExportFirst,
	accountDeletionKeeps,
	accountDeletionRemoves,
	canConfirmDeletion,
	deletionBlockedReason,
	deletionConfirmationPrompt,
} from '@/lib/utils/account-deletion'

/**
 * TRUST-01. The last card in Settings, because it is the last thing anyone
 * should reach for. The card's own control only opens the confirmation, so it
 * is an outline; the one control that deletes is the filled destructive button
 * inside the dialog (§4.3 rule 5), and it stays disabled until the username is
 * typed. The dialog cannot be dismissed while the deletion is in flight.
 */
export function DeleteAccountCard({
	profile,
}: {
	profile: { username: string; isModerator: boolean }
}) {
	const errorText = useApiErrorMessage()
	const t = useTranslations('core.accountDeletion')
	const tCard = useTranslations('settings.deleteAccount')
	const [open, setOpen] = useState(false)
	const [typed, setTyped] = useState('')
	const remove = useDeleteAccount()
	const inputId = useId()
	const blocked = deletionBlockedReason(profile, t)
	const confirmed = canConfirmDeletion(typed, profile.username)

	const onOpenChange = (next: boolean) => {
		if (remove.isPending) return
		setOpen(next)
		if (!next) {
			setTyped('')
			remove.reset()
		}
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<Trash2 className="size-5 text-ink-3" aria-hidden />
					<CardTitle>{tCard('title')}</CardTitle>
				</div>
				<CardDescription>{tCard('description')}</CardDescription>
			</CardHeader>
			<CardContent>
				{blocked ? (
					<p className="type-body-sm text-ink-2">{blocked}</p>
				) : (
					<Button
						type="button"
						variant="destructive"
						onClick={() => setOpen(true)}
					>
						{tCard('open')}
					</Button>
				)}
			</CardContent>

			<AlertDialog open={open} onOpenChange={onOpenChange}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{tCard('dialogTitle')}</AlertDialogTitle>
						<AlertDialogDescription>
							{tCard('dialogDescription')}
						</AlertDialogDescription>
					</AlertDialogHeader>

					<ul className="type-body-sm list-disc space-y-1 pl-5 text-ink-2">
						{accountDeletionRemoves(t).map(item => (
							<li key={item}>{item}</li>
						))}
					</ul>
					<p className="type-body-sm text-ink-2">{accountDeletionKeeps(t)}</p>
					<div className="mark mark-warning flex gap-2 bg-surface-sunk py-2 pl-3 pr-3">
						<AlertTriangle
							className="mt-0.5 size-4 shrink-0 text-warning-strong"
							aria-hidden
						/>
						<p className="type-body-sm text-foreground">
							{accountDeletionExportFirst(t)}
						</p>
					</div>

					<form
						className="space-y-2"
						onSubmit={event => {
							event.preventDefault()
							if (!confirmed || remove.isPending) return
							remove.mutate({ confirmUsername: typed })
						}}
					>
						<Label htmlFor={inputId}>
							{deletionConfirmationPrompt(profile.username, t)}
						</Label>
						<Input
							id={inputId}
							value={typed}
							onChange={event => setTyped(event.target.value)}
							autoComplete="off"
							autoCapitalize="none"
							autoCorrect="off"
							spellCheck={false}
							disabled={remove.isPending}
							aria-invalid={remove.isError || undefined}
							aria-describedby={remove.isError ? `${inputId}-error` : undefined}
						/>
						{remove.isError ? (
							<p
								id={`${inputId}-error`}
								role="alert"
								className="type-body-sm text-destructive"
							>
								{errorText(remove.error)}
							</p>
						) : null}

						<AlertDialogFooter className="pt-2">
							<AlertDialogCancel disabled={remove.isPending}>
								{tCard('cancel')}
							</AlertDialogCancel>
							<Button
								type="submit"
								variant="destructiveSolid"
								disabled={!confirmed || remove.isPending}
							>
								{remove.isPending ? (
									<>
										<Loader2 className="size-4 animate-spin" aria-hidden />
										{tCard('deleting')}
									</>
								) : (
									tCard('confirm')
								)}
							</Button>
						</AlertDialogFooter>
					</form>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	)
}
