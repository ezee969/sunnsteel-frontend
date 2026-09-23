'use client'

import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
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
import { useDeleteAccount } from '@/lib/api/hooks/useDeleteAccount'
import {
	ACCOUNT_DELETION_EXPORT_FIRST,
	ACCOUNT_DELETION_KEEPS,
	ACCOUNT_DELETION_REMOVES,
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
	const [open, setOpen] = useState(false)
	const [typed, setTyped] = useState('')
	const remove = useDeleteAccount()
	const inputId = useId()
	const blocked = deletionBlockedReason(profile)
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
					<CardTitle>Delete Account</CardTitle>
				</div>
				<CardDescription>
					Delete your account and everything in it. It happens at once and
					cannot be undone.
				</CardDescription>
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
						Delete Account…
					</Button>
				)}
			</CardContent>

			<AlertDialog open={open} onOpenChange={onOpenChange}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete your account?</AlertDialogTitle>
						<AlertDialogDescription>
							This deletes all of the following at once. It cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>

					<ul className="type-body-sm list-disc space-y-1 pl-5 text-ink-2">
						{ACCOUNT_DELETION_REMOVES.map(item => (
							<li key={item}>{item}</li>
						))}
					</ul>
					<p className="type-body-sm text-ink-2">{ACCOUNT_DELETION_KEEPS}</p>
					<div className="mark mark-warning flex gap-2 bg-surface-sunk py-2 pl-3 pr-3">
						<AlertTriangle
							className="mt-0.5 size-4 shrink-0 text-warning-strong"
							aria-hidden
						/>
						<p className="type-body-sm text-foreground">
							{ACCOUNT_DELETION_EXPORT_FIRST}
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
							{deletionConfirmationPrompt(profile.username)}
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
								{remove.error.message}
							</p>
						) : null}

						<AlertDialogFooter className="pt-2">
							<AlertDialogCancel disabled={remove.isPending}>
								Cancel
							</AlertDialogCancel>
							<Button
								type="submit"
								variant="destructiveSolid"
								disabled={!confirmed || remove.isPending}
							>
								{remove.isPending ? (
									<>
										<Loader2 className="size-4 animate-spin" aria-hidden />
										Deleting…
									</>
								) : (
									'Delete Account'
								)}
							</Button>
						</AlertDialogFooter>
					</form>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	)
}
