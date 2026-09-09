import { Skeleton } from '@/components/ui/skeleton'

export default function RoutinesLoading() {
	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			{/* Masthead */}
			<div className="rule-heading pb-4">
				<Skeleton className="mb-2 h-8 w-48" />
				<Skeleton className="h-4 w-64" />
			</div>

			{/* Filters */}
			<div className="flex flex-wrap gap-2">
				<Skeleton className="h-10 w-20" />
				<Skeleton className="h-10 w-24" />
				<Skeleton className="h-10 w-28" />
				<Skeleton className="h-10 w-32" />
			</div>

			{/* The routines ledger: ruled rows, matching what loads (§11.5) */}
			<div className="border-t border-rule">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="rule-row py-3 pl-3 pr-1 sm:pl-4">
						<div className="flex items-start justify-between gap-2">
							<div className="min-w-0 flex-1 space-y-2">
								<Skeleton className="h-4 w-40" />
								<Skeleton className="h-3 w-60 max-w-full" />
								<Skeleton className="h-3 w-28" />
							</div>
							<Skeleton className="size-9 shrink-0" />
						</div>
						<div className="mt-2 space-y-2">
							<Skeleton className="h-3 w-32" />
							<Skeleton className="h-3 w-full" />
							<div className="flex items-center gap-1.5 pt-1">
								<Skeleton className="h-9 w-[120px]" />
								<Skeleton className="size-9" />
								<Skeleton className="size-9" />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
