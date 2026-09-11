import { Skeleton } from '@/components/ui/skeleton'

/**
 * Mirrors the restyled profile — masthead over the double rule, a narrow
 * details column and a wide one — so first paint does not reflow into a
 * different layout. No page-level fade-in (§9.2) and no rounded cards (§7).
 */
export function ProfileLoading() {
	return (
		<div className="mx-auto w-full max-w-5xl space-y-8 sm:space-y-12">
			<div className="rule-heading flex flex-col gap-5 pb-6 sm:flex-row sm:items-end">
				<Skeleton className="h-20 w-20 shrink-0 rounded-full sm:h-24 sm:w-24" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-8 w-56 max-w-full" />
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-4 w-40" />
				</div>
			</div>
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
				<div className="space-y-3">
					<Skeleton className="h-5 w-24" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-2/3" />
				</div>
				<div className="space-y-3 lg:col-span-2">
					<Skeleton className="h-28 w-full" />
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
				</div>
			</div>
		</div>
	)
}
