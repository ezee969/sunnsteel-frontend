'use client'

import type { ReportReason, ReportSubjectKind } from '@sunsteel/contracts'
import { REPORT_DETAILS_MAX_LENGTH } from '@sunsteel/contracts'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useReportMember } from '@/lib/api/hooks/useModeration'
import {
	REPORT_REASON_OPTIONS,
	REPORT_SUBJECT_LABELS,
} from '@/lib/utils/moderation'

interface ReportDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	subjectKind: ReportSubjectKind
	/** A member id or username, a routine id, or a session share token. */
	subjectId: string
}

/**
 * PROF-10's report path. The receipt says the report was recorded and nothing
 * more: the queue, the review and the enforcement are `TRUST-04`, so promising
 * that someone will look at it, or when, would be a promise the product cannot
 * currently keep.
 */
export function ReportDialog({
	open,
	onOpenChange,
	subjectKind,
	subjectId,
}: ReportDialogProps) {
	const errorText = useApiErrorMessage()
	const t = useTranslations('social.report')
	const tModeration = useTranslations('social.moderation')
	const { push } = useToast()
	const report = useReportMember()
	const [reason, setReason] = useState<ReportReason>('SPAM')
	const [details, setDetails] = useState('')

	const submit = () => {
		report.mutate(
			{ subjectKind, subjectId, reason, details: details.trim() || null },
			{
				onSuccess: () => {
					onOpenChange(false)
					setDetails('')
					push({
						title: t('recorded'),
						description: tModeration('reportReceipt'),
						variant: 'success',
					})
				},
				onError: error => {
					push({
						title: t('failed'),
						description: errorText(error),
						variant: 'destructive',
					})
				},
			},
		)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t('title', {
							subject: tModeration(REPORT_SUBJECT_LABELS[subjectKind]),
						})}
					</DialogTitle>
					<DialogDescription>{tModeration('reportReceipt')}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="report-reason">{t('reason')}</Label>
						<NativeSelect
							id="report-reason"
							value={reason}
							onChange={event => setReason(event.target.value as ReportReason)}
						>
							{REPORT_REASON_OPTIONS.map(option => (
								<option key={option.value} value={option.value}>
									{tModeration(option.label)}
								</option>
							))}
						</NativeSelect>
					</div>
					<div className="space-y-2">
						<Label htmlFor="report-details">{t('details')}</Label>
						<Textarea
							id="report-details"
							value={details}
							maxLength={REPORT_DETAILS_MAX_LENGTH}
							onChange={event => setDetails(event.target.value)}
							placeholder={t('detailsPlaceholder')}
						/>
						<p className="type-body-sm text-ink-3">
							{details.length}/{REPORT_DETAILS_MAX_LENGTH}
						</p>
					</div>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						{t('cancel')}
					</Button>
					<Button type="button" onClick={submit} disabled={report.isPending}>
						{report.isPending ? (
							<Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
						) : null}
						{t('send')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
