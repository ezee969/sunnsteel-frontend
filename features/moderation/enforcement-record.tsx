'use client'

import { useLocale, useTranslations } from 'next-intl'

import { InlineError } from '@/components/layout/inline-error'
import { LoadingRows } from '@/components/layout/loading-rows'
import { Button } from '@/components/ui/button'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useModerationHistory } from '@/lib/api/hooks/useModeration'
import {
	describeModerationAction,
	REPORT_SUBJECT_HEADINGS,
} from '@/lib/utils/moderation'

/**
 * The enforcement record. It is append-only and says so: there is no edit
 * control and no delete control here, because there is no server path that
 * could honour one. An undone hide appears as a later `RESTORE_SUBJECT` entry
 * above the `HIDE_SUBJECT` one, which stays exactly as it was written.
 */
export function EnforcementRecord() {
	const errorText = useApiErrorMessage()
	const t = useTranslations('social.moderationPage')
	const tModeration = useTranslations('social.moderation')
	const locale = useLocale()
	const history = useModerationHistory()
	const actions = (history.data?.pages ?? []).flatMap(page => page.actions)

	return (
		<div className="flex flex-col gap-4">
			<p className="type-body-sm text-ink-3">{tModeration('recordNote')}</p>

			{history.isLoading ? (
				<LoadingRows label={t('loadingRecord')} rows={3} />
			) : history.error ? (
				<InlineError
					title={t('recordFailed')}
					message={errorText(history.error)}
					onRetry={() => void history.refetch()}
				/>
			) : actions.length ? (
				<div className="border-t border-rule-faint">
					{actions.map(action => (
						<div key={action.id} className="rule-row flex flex-col gap-1 py-3">
							<p className="type-panel text-foreground">
								{describeModerationAction(action, tModeration, locale)}
							</p>
							<p className="type-body-sm text-ink-3">
								{t('recordSubject', {
									kind: tModeration(
										REPORT_SUBJECT_HEADINGS[action.subjectKind],
									),
									id: action.subjectId,
								})}
							</p>
							{action.note ? (
								<p className="type-body-sm text-ink-2">{action.note}</p>
							) : null}
						</div>
					))}
				</div>
			) : (
				<p className="type-body-sm py-4 text-ink-3">{t('nothingRecorded')}</p>
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
					{history.isFetchingNextPage ? t('loading') : t('loadMore')}
				</Button>
			) : null}
		</div>
	)
}
