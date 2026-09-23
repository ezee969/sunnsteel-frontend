'use client'

import { Download, FileJson, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { useExportAccount } from '@/lib/api/hooks/useExportAccount'
import {
	ACCOUNT_EXPORT_CONTENTS,
	ACCOUNT_EXPORT_NOTES,
} from '@/lib/utils/account-export'

/**
 * EXPORT-01. Sits directly above Delete Account, because downloading is the
 * step someone leaving should take first -- the deletion dialog points here.
 */
export function DownloadDataCard() {
	const exportAccount = useExportAccount()
	const { push } = useToast()

	return (
		<Card id="download-data">
			<CardHeader>
				<div className="flex items-center gap-2">
					<FileJson className="size-5 text-ink-3" aria-hidden />
					<CardTitle>Download Your Data</CardTitle>
				</div>
				<CardDescription>{ACCOUNT_EXPORT_CONTENTS}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="type-body-sm text-ink-3">{ACCOUNT_EXPORT_NOTES}</p>
				<Button
					type="button"
					variant="outline"
					disabled={exportAccount.isPending}
					onClick={() =>
						exportAccount.mutate(undefined, {
							onSuccess: () =>
								push({
									title: 'Your data was downloaded',
									description:
										'Check your downloads for the sunnsteel-….json file.',
									variant: 'success',
								}),
							onError: error =>
								push({
									title: 'Your data could not be downloaded',
									description: error.message,
									variant: 'destructive',
								}),
						})
					}
				>
					{exportAccount.isPending ? (
						<>
							<Loader2 className="size-4 animate-spin" aria-hidden />
							Preparing your file…
						</>
					) : (
						<>
							<Download className="size-4" aria-hidden />
							Download My Data
						</>
					)}
				</Button>
			</CardContent>
		</Card>
	)
}
