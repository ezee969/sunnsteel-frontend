'use client'

import { Download, FileJson, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

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

/**
 * EXPORT-01. Sits directly above Delete Account, because downloading is the
 * step someone leaving should take first -- the deletion dialog points here.
 */
export function DownloadDataCard() {
	const t = useTranslations('settings.accountExport')
	const exportAccount = useExportAccount()
	const { push } = useToast()

	return (
		<Card id="download-data">
			<CardHeader>
				<div className="flex items-center gap-2">
					<FileJson className="size-5 text-ink-3" aria-hidden />
					<CardTitle>{t('title')}</CardTitle>
				</div>
				<CardDescription>{t('contents')}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="type-body-sm text-ink-3">{t('notes')}</p>
				<Button
					type="button"
					variant="outline"
					disabled={exportAccount.isPending}
					onClick={() =>
						exportAccount.mutate(undefined, {
							onSuccess: () =>
								push({
									title: t('downloadedTitle'),
									description: t('downloadedDescription'),
									variant: 'success',
								}),
							onError: error =>
								push({
									title: t('failedTitle'),
									description: error.message,
									variant: 'destructive',
								}),
						})
					}
				>
					{exportAccount.isPending ? (
						<>
							<Loader2 className="size-4 animate-spin" aria-hidden />
							{t('preparing')}
						</>
					) : (
						<>
							<Download className="size-4" aria-hidden />
							{t('download')}
						</>
					)}
				</Button>
			</CardContent>
		</Card>
	)
}
