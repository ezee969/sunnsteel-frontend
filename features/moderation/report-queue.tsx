'use client'

import type {
	ModerationActionKind,
	ModerationReport,
	ReportStatus,
} from '@sunsteel/contracts'
import { EyeOff, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { ReviewActionDialog } from '@/features/moderation/review-action-dialog'
import {
	useModerationQueue,
	useRecordSubjectView,
} from '@/lib/api/hooks/useModeration'
import {
	availableReviewActions,
	describeOtherReports,
	describeReportFiled,
	describeReportSubject,
	MODERATION_ACCESS_NOTE,
	MODERATION_MISSING_NOTE,
	MODERATION_WITHHELD_ACTIONS_NOTE,
	MODERATION_WITHHELD_NOTE,
	moderationSubjectHref,
	REPORT_REASON_LABELS,
	REPORT_STATUS_LABELS,
	reportSubjectOwner,
} from '@/lib/utils/moderation'

type ReviewAction = Exclude<ModerationActionKind, 'VIEW_SUBJECT'>

const STATUS_TABS: ReportStatus[] = ['OPEN', 'ACTIONED', 'DISMISSED']

/**
 * TRUST-04's queue. Two rules shape every row.
 *
 * **It never shows what the reviewer may not see.** A withheld subject is
 * named by its kind and nothing else, and carries no link, because the title
 * and the owner are the content.
 *
 * **Opening a subject is an action.** The row awaits the audit record before
 * navigating, so a read cannot happen without one; a failed record means the
 * reviewer stays where they are rather than opening it unlogged.
 */
export function ReportQueue() {
	const router = useRouter()
	const { push } = useToast()
	const [status, setStatus] = useState<ReportStatus>('OPEN')
	const [pending, setPending] = useState<{
		action: ReviewAction
		report: ModerationReport
	} | null>(null)
	const [opening, setOpening] = useState<string | null>(null)

	const queue = useModerationQueue(status)
	const recordView = useRecordSubjectView()
	const pages = queue.data?.pages ?? []
	const reports = pages.flatMap(page => page.reports)
	const openCount = pages[0]?.openCount ?? 0

	const open = (report: ModerationReport) => {
		const href = moderationSubjectHref(report.subject)
		if (!href) return
		setOpening(report.id)
		recordView.mutate(
			{ reportId: report.id },
			{
				onSuccess: () => router.push(href),
				onError: error => {
					setOpening(null)
					push({
						title: 'Could not open this',
						description: `${error.message} Opening reported content is recorded, so it was not opened.`,
						variant: 'destructive',
					})
				},
			},
		)
	}

	return (
		<div className="flex flex-col gap-4">
			<p className="type-body-sm text-ink-3">{MODERATION_ACCESS_NOTE}</p>

			<div role="group" aria-label="Report status" className="flex gap-1">
				{STATUS_TABS.map(option => (
					<Button
						key={option}
						type="button"
						size="sm"
						variant={status === option ? 'secondary' : 'ghost'}
						aria-pressed={status === option}
						onClick={() => setStatus(option)}
					>
						{REPORT_STATUS_LABELS[option]}
						{option === 'OPEN' && openCount > 0 ? ` (${openCount})` : ''}
					</Button>
				))}
			</div>

			{queue.isLoading ? (
				<div className="type-body-sm flex items-center justify-center gap-2 py-8 text-ink-3">
					<Loader2 className="size-4 animate-spin" aria-hidden />
					Loading reports…
				</div>
			) : queue.error ? (
				<div role="alert" className="border border-destructive bg-surface p-4">
					<p className="type-body-sm text-destructive">{queue.error.message}</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="mt-3"
						onClick={() => void queue.refetch()}
					>
						Try Again
					</Button>
				</div>
			) : reports.length ? (
				<div className="border-t border-rule-faint">
					{reports.map(report => {
						const actions = availableReviewActions(report)
						const owner = reportSubjectOwner(report.subject)
						const others = describeOtherReports(report.otherOpenReports)
						return (
							<article
								key={report.id}
								className="rule-row flex flex-col gap-3 py-4"
							>
								<div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
									<p className="type-panel text-foreground">
										{describeReportSubject(report.subject)}
									</p>
									{report.subject.isHidden ? (
										<span className="type-body-sm inline-flex items-center gap-1 text-ink-3">
											<EyeOff className="size-3.5" aria-hidden />
											Hidden
										</span>
									) : null}
								</div>

								<p className="type-body-sm text-ink-2">
									{REPORT_REASON_LABELS[report.reason]}
									{owner ? ` · ${owner}` : ''}
								</p>
								<p className="type-body-sm text-ink-3">
									{describeReportFiled(report)}
								</p>
								{report.details ? (
									<p className="type-body-sm text-ink-2">{report.details}</p>
								) : null}
								{others ? (
									<p className="type-body-sm text-ink-3">{others}</p>
								) : null}
								{report.subject.isMissing ? (
									<p className="type-body-sm text-ink-3">
										{MODERATION_MISSING_NOTE}
									</p>
								) : report.subject.isWithheld ? (
									<p className="type-body-sm text-ink-3">
										{MODERATION_WITHHELD_NOTE}
										{actions.canDismiss || actions.canHide
											? ` ${MODERATION_WITHHELD_ACTIONS_NOTE}`
											: ''}
									</p>
								) : null}

								<div className="flex flex-wrap gap-2">
									{actions.canOpen ? (
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled={opening === report.id}
											onClick={() => open(report)}
										>
											{opening === report.id ? (
												<Loader2
													className="mr-2 size-4 animate-spin"
													aria-hidden
												/>
											) : null}
											Open content
										</Button>
									) : null}
									{actions.canDismiss ? (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() =>
												setPending({ action: 'DISMISS_REPORT', report })
											}
										>
											Dismiss
										</Button>
									) : null}
									{actions.canHide ? (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() =>
												setPending({ action: 'HIDE_SUBJECT', report })
											}
										>
											Hide content
										</Button>
									) : null}
									{actions.canRestore ? (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() =>
												setPending({ action: 'RESTORE_SUBJECT', report })
											}
										>
											Restore content
										</Button>
									) : null}
								</div>
							</article>
						)
					})}
				</div>
			) : (
				<p className="type-body-sm py-4 text-ink-3">
					{status === 'OPEN'
						? 'No reports are waiting. Nothing here needs a decision.'
						: 'No reports in this state.'}
				</p>
			)}

			{queue.hasNextPage ? (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="self-start"
					disabled={queue.isFetchingNextPage}
					onClick={() => void queue.fetchNextPage()}
				>
					{queue.isFetchingNextPage ? 'Loading…' : 'Load more'}
				</Button>
			) : null}

			{pending ? (
				<ReviewActionDialog
					open
					onOpenChange={next => {
						if (!next) setPending(null)
					}}
					action={pending.action}
					report={pending.report}
				/>
			) : null}
		</div>
	)
}
