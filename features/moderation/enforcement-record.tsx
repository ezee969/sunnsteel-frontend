'use client'

import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useModerationHistory } from '@/lib/api/hooks/useModeration'
import {
	describeModerationAction,
	MODERATION_RECORD_NOTE,
	REPORT_SUBJECT_HEADINGS,
} from '@/lib/utils/moderation'

/**
 * The enforcement record. It is append-only and says so: there is no edit
 * control and no delete control here, because there is no server path that
 * could honour one. An undone hide appears as a later `RESTORE_SUBJECT` entry
 * above the `HIDE_SUBJECT` one, which stays exactly as it was written.
 */
export function EnforcementRecord() {
	const history = useModerationHistory()
	const actions = (history.data?.pages ?? []).flatMap(page => page.actions)

	return (
		<div className="flex flex-col gap-4">
			<p className="type-body-sm text-ink-3">{MODERATION_RECORD_NOTE}</p>

			{history.isLoading ? (
				<div className="type-body-sm flex items-center justify-center gap-2 py-8 text-ink-3">
					<Loader2 className="size-4 animate-spin" aria-hidden />
					Loading the record…
				</div>
			) : history.error ? (
				<div role="alert" className="border border-destructive bg-surface p-4">
					<p className="type-body-sm text-destructive">
						{history.error.message}
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="mt-3"
						onClick={() => void history.refetch()}
					>
						Try Again
					</Button>
				</div>
			) : actions.length ? (
				<div className="border-t border-rule-faint">
					{actions.map(action => (
						<div key={action.id} className="rule-row flex flex-col gap-1 py-3">
							<p className="type-panel text-foreground">
								{describeModerationAction(action)}
							</p>
							<p className="type-body-sm text-ink-3">
								{REPORT_SUBJECT_HEADINGS[action.subjectKind]} ·{' '}
								{action.subjectId}
							</p>
							{action.note ? (
								<p className="type-body-sm text-ink-2">{action.note}</p>
							) : null}
						</div>
					))}
				</div>
			) : (
				<p className="type-body-sm py-4 text-ink-3">
					Nothing has been recorded yet.
				</p>
			)}

			{history.hasNextPage ? (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="self-start"
					disabled={history.isFetchingNextPage}
					onClick={() => void history.fetchNextPage()}
				>
					{history.isFetchingNextPage ? 'Loading…' : 'Load more'}
				</Button>
			) : null}
		</div>
	)
}
