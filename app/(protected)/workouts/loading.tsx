import { Skeleton } from '@/components/ui/skeleton'

// Mirrors the page's one resting state - the "No Active Workout" inscription
// over the double rule and its row of actions. It used to sketch three
// medallion cards and a recent-activity list the page no longer has (TD-38).
// With a live session the page redirects into it, so there is nothing else to
// mirror.
export default function WorkoutsLoading() {
	return (
		<div
			className="flex flex-col gap-6"
			role="status"
			aria-label="Loading workouts"
		>
			<div className="rule-heading pb-4">
				<Skeleton className="h-7 w-64 max-w-full md:h-9 md:w-80" />
				<Skeleton className="mt-3 h-4 w-full max-w-md" />
				<Skeleton className="mt-1.5 h-4 w-2/3 max-w-xs" />
			</div>
			<div className="flex flex-wrap gap-3">
				<Skeleton className="h-10 w-36" />
				<Skeleton className="h-10 w-32" />
				<Skeleton className="h-10 w-32" />
			</div>
		</div>
	)
}
