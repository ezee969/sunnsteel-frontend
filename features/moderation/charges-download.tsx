'use client'

import { useMutation } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'

import { InlineError } from '@/components/layout/inline-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { moderationReviewService } from '@/lib/api/services/moderationService'
import { chargesFileName, previousMonth } from '@/lib/utils/charges-download'

/**
 * BILL-06: the month's charges from Mercado Pago as a CSV, for the owner to
 * issue a Factura C for each in ARCA. The request needs the bearer token, so
 * the file is fetched and handed to the browser's download, as the account
 * export is.
 */
export function ChargesDownload() {
	const t = useTranslations('social.moderationPage.chargesSection')
	const errorText = useApiErrorMessage()
	const id = useId()
	const [month, setMonth] = useState(() => previousMonth(new Date()))

	const download = useMutation({
		mutationFn: (chosen: string) => moderationReviewService.chargesCsv(chosen),
		onSuccess: (contents, chosen) => {
			const url = URL.createObjectURL(
				new Blob([contents], { type: 'text/csv;charset=utf-8' }),
			)
			const link = document.createElement('a')
			link.href = url
			link.download = chargesFileName(chosen)
			document.body.appendChild(link)
			link.click()
			link.remove()
			setTimeout(() => URL.revokeObjectURL(url), 0)
		},
	})

	return (
		<section className="flex flex-col gap-4" aria-labelledby={`${id}-title`}>
			<div className="flex flex-col gap-1">
				<h2 id={`${id}-title`} className="type-section">
					{t('title')}
				</h2>
				<p className="type-body-sm text-ink-3 max-w-[68ch]">
					{t('description')}
				</p>
			</div>
			<form
				className="flex flex-wrap items-end gap-3"
				onSubmit={event => {
					event.preventDefault()
					if (month) download.mutate(month)
				}}
			>
				<div className="flex flex-col gap-1">
					<Label htmlFor={`${id}-month`}>{t('month')}</Label>
					<Input
						id={`${id}-month`}
						type="month"
						required
						value={month}
						onChange={event => setMonth(event.target.value)}
						className="w-auto"
					/>
				</div>
				<Button type="submit" disabled={!month || download.isPending}>
					<Download aria-hidden="true" />
					{download.isPending ? t('downloading') : t('download')}
				</Button>
			</form>
			{download.isError ? (
				<InlineError
					title={t('failed')}
					message={errorText(download.error)}
					onRetry={() => download.mutate(month)}
					retrying={download.isPending}
				/>
			) : null}
			<p className="type-body-sm text-ink-3 max-w-[68ch]">{t('columns')}</p>
		</section>
	)
}
