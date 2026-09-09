import { Skeleton } from '@/components/ui/skeleton'

interface RoutinesSkeletonListProps {
	count?: number
}

/**
 * Loading placeholder for the routines ledger.
 *
 * It mirrors the ruled rows `RoutineCard` now renders (§11.5) rather than the
 * card stack it used to: a skeleton that shows boxes the loaded page does not
 * have makes first paint reflow into a different layout.
 *
 * @param count - Number of skeleton rows to render (defaults to 3)
 */
export function RoutinesSkeletonList({ count = 3 }: RoutinesSkeletonListProps) {
	return (
		<div className="border-t border-rule sm:pr-4">
			{Array.from({ length: count }).map((_, i) => (
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
	)
}
