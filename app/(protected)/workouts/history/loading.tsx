import { Skeleton } from '@/components/ui/skeleton'

export default function WorkoutHistoryLoading() {
	return (
		<div className="mx-auto max-w-3xl space-y-6 p-4">
			{/* Masthead */}
			<div className="rule-heading pb-4">
				<Skeleton className="mb-2 h-8 w-48" />
				<Skeleton className="h-4 w-64" />
			</div>

			{/* Section heading + filter control */}
			<div className="rule-heading flex items-end justify-between gap-2 pb-2">
				<div className="space-y-2">
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-3 w-56" />
				</div>
				<Skeleton className="h-9 w-20" />
			</div>

			{/* The session ledger: ruled rows, matching what loads (§11.5) */}
			<div className="border-t border-rule">
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} className="rule-row py-3 pl-3 pr-1">
						<div className="flex items-baseline justify-between gap-4">
							<Skeleton className="h-4 w-56 max-w-full" />
							<Skeleton className="h-3 w-20 shrink-0" />
						</div>
						<div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
							{Array.from({ length: 4 }).map((__, j) => (
								<div key={j} className="space-y-1">
									<Skeleton className="h-3 w-16" />
									<Skeleton className="h-3 w-24 max-w-full" />
								</div>
							))}
						</div>
					</div>
				))}
			</div>

			{/* Load more */}
			<div className="pt-4 text-center">
				<Skeleton className="mx-auto h-10 w-32" />
			</div>
		</div>
	)
}
