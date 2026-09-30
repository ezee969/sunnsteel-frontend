import type {
	ComebackRecognition as ComebackRecognitionData,
	ComebackRecognitionSummary,
} from '@sunsteel/contracts'
import { RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import { Explanation } from '@/components/layout/explanation'
import { Skeleton } from '@/components/ui/skeleton'
import type { Locale } from '@/i18n/config'
import {
	formatAchievementDate,
	formatComebackEvidence,
} from '@/lib/utils/achievements'

interface ComebackRecognitionProps {
	data?: ComebackRecognitionSummary | null
	isPending: boolean
}

function ComebackRow({ comeback }: { comeback: ComebackRecognitionData }) {
	const locale = useLocale() as Locale
	const t = useTranslations('achievements.comeback')
	return (
		<li className="rule-row grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
			<div className="flex min-w-0 gap-3">
				<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-rule bg-surface">
					<RotateCcw className="size-4 text-ink-3" aria-hidden />
				</span>
				<div className="min-w-0">
					<h3 className="type-panel text-foreground">{t('recorded')}</h3>
					<p className="type-data mt-1 text-foreground">
						{formatComebackEvidence(comeback, t)}
					</p>
				</div>
			</div>
			<div className="pl-11 sm:pl-0 sm:text-right">
				<p className="type-body-sm text-ink-3">
					{t('recognized', {
						date: formatAchievementDate(comeback.recognizedAt, locale),
					})}
				</p>
				<Link
					href={`/workouts/history/${comeback.sourceSessionId}`}
					className="type-body-sm mt-1 inline-block text-primary underline-offset-4 hover:underline"
				>
					{t('viewSession')}
				</Link>
			</div>
		</li>
	)
}

export function ComebackRecognition({
	data,
	isPending,
}: ComebackRecognitionProps) {
	const t = useTranslations('achievements.comeback')
	if (isPending) {
		return (
			<section aria-label={t('loadingAria')} className="space-y-4">
				<Skeleton className="h-16" />
				<Skeleton className="h-24" />
			</section>
		)
	}

	if (!data) return null

	return (
		<section aria-labelledby="comeback-recognition" className="space-y-4">
			<div className="rule-heading pb-4">
				<h2 id="comeback-recognition" className="type-panel text-foreground">
					{t('title')}
				</h2>
				<Explanation className="mt-1" summary={t('summary')}>
					<p>
						{t('rule', {
							minimumInactiveDays: data.minimumInactiveDays,
							requiredActiveDays: data.requiredActiveDays,
							windowDays: data.windowDays,
						})}
					</p>
				</Explanation>
			</div>

			{data.recognitions.length ? (
				<>
					<ul className="border-y border-rule">
						{data.recognitions.map(comeback => (
							<ComebackRow key={comeback.id} comeback={comeback} />
						))}
					</ul>
					{data.historyTruncated ? (
						<p className="type-body-sm text-ink-3">{t('truncated')}</p>
					) : null}
				</>
			) : (
				<div role="status" className="border-y border-rule py-4">
					<div className="flex gap-3">
						<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-rule bg-surface">
							<RotateCcw className="size-4 text-ink-3" aria-hidden />
						</span>
						<div>
							<h3 className="type-panel text-foreground">{t('emptyTitle')}</h3>
							<p className="type-body-sm mt-1 max-w-2xl text-ink-3">
								{t('emptyBody')}
							</p>
						</div>
					</div>
				</div>
			)}
		</section>
	)
}
