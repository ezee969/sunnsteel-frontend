import type {
	ComebackRecognition as ComebackRecognitionData,
	ComebackRecognitionSummary,
} from '@sunsteel/contracts'
import { RotateCcw } from 'lucide-react'
import Link from 'next/link'

import { Skeleton } from '@/components/ui/skeleton'
import {
	formatAchievementDate,
	formatComebackEvidence,
} from '@/lib/utils/achievements'

interface ComebackRecognitionProps {
	data?: ComebackRecognitionSummary | null
	isPending: boolean
}

function ComebackRow({ comeback }: { comeback: ComebackRecognitionData }) {
	return (
		<li className="rule-row grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
			<div className="flex min-w-0 gap-3">
				<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-rule bg-surface">
					<RotateCcw className="size-4 text-ink-3" aria-hidden />
				</span>
				<div className="min-w-0">
					<h3 className="type-panel text-foreground">Comeback recorded</h3>
					<p className="type-data mt-1 text-foreground">
						{formatComebackEvidence(comeback)}
					</p>
				</div>
			</div>
			<div className="pl-11 sm:pl-0 sm:text-right">
				<p className="type-body-sm text-ink-3">
					Recognized {formatAchievementDate(comeback.recognizedAt)}
				</p>
				<Link
					href={`/workouts/history/${comeback.sourceSessionId}`}
					className="type-body-sm mt-1 inline-block text-primary underline-offset-4 hover:underline"
				>
					View session
				</Link>
			</div>
		</li>
	)
}

export function ComebackRecognition({
	data,
	isPending,
}: ComebackRecognitionProps) {
	if (isPending) {
		return (
			<section aria-label="Loading comeback recognition" className="space-y-4">
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
					Comeback recognition
				</h2>
				<p className="type-body-sm mt-1 max-w-2xl text-ink-3">
					Time away does not erase the work of returning. A comeback is recorded
					after {data.minimumInactiveDays} full days without a completed
					workout, then {data.requiredActiveDays} separate training days within{' '}
					{data.windowDays} days of returning. Sessions on the same day count
					once.
				</p>
			</div>

			{data.recognitions.length ? (
				<>
					<ul className="border-y border-rule">
						{data.recognitions.map(comeback => (
							<ComebackRow key={comeback.id} comeback={comeback} />
						))}
					</ul>
					{data.historyTruncated ? (
						<p className="type-body-sm text-ink-3">
							Shows comebacks detected in your 500 most recent completed
							sessions.
						</p>
					) : null}
				</>
			) : (
				<div role="status" className="border-y border-rule py-4">
					<div className="flex gap-3">
						<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-rule bg-surface">
							<RotateCcw className="size-4 text-ink-3" aria-hidden />
						</span>
						<div>
							<h3 className="type-panel text-foreground">
								No comeback recorded yet
							</h3>
							<p className="type-body-sm mt-1 max-w-2xl text-ink-3">
								If time away happens, returning steadily can earn one. An
								uninterrupted streak is not the only form of consistency.
							</p>
						</div>
					</div>
				</div>
			)}
		</section>
	)
}
