'use client'

import { Skeleton } from '@/components/ui/skeleton'

interface SessionLoadingSkeletonProps {
	showHeader?: boolean
	exerciseCount?: number
	setsPerExercise?: number
}

/**
 * The session screen before its data arrives, drawn in the screen's current
 * composition: the sticky masthead over the double rule, the inline action row
 * (§11.8) and a ruled list of exercises whose set rows are wells (§11.7). It
 * used to sketch the boxed action card with its own progress bar, which Phase
 * 13 removed from the page (TD-38). Used by the page while it loads and by the
 * route's `loading.tsx`.
 */
export const SessionLoadingSkeleton = ({
	showHeader = true,
	exerciseCount = 3,
	setsPerExercise = 3,
}: SessionLoadingSkeletonProps) => {
	return (
		<div
			data-testid="session-loading-skeleton"
			className="min-h-screen bg-background"
			aria-label="Loading session data"
			role="status"
		>
			{/* Masthead: back control, title and day on the left, figures right. */}
			{showHeader && (
				<div
					data-testid="header-skeleton"
					className="rule-heading sticky top-0 z-20 bg-background"
				>
					<div className="ledger-page py-3">
						<div className="flex items-center justify-between gap-4">
							<div className="flex min-w-0 items-center gap-3">
								<Skeleton className="size-11 md:size-9" />
								<div className="space-y-1.5">
									<Skeleton className="h-5 w-40" />
									<Skeleton className="h-3.5 w-16" />
								</div>
							</div>
							<div className="flex shrink-0 items-center gap-6">
								{['w-20', 'w-10'].map(width => (
									<div key={width} className="hidden space-y-1.5 sm:block">
										<Skeleton className="ml-auto h-3.5 w-12" />
										<Skeleton className={`ml-auto h-4 ${width}`} />
									</div>
								))}
								<div className="space-y-1.5">
									<Skeleton className="ml-auto h-3.5 w-16" />
									<Skeleton className="ml-auto h-4 w-10" />
								</div>
							</div>
						</div>
						<div className="mt-3 flex items-center justify-between border-t border-rule-faint pt-2 sm:hidden">
							{['w-20', 'w-8', 'w-16'].map(width => (
								<div key={width} className="space-y-1.5">
									<Skeleton className="h-3.5 w-12" />
									<Skeleton className={`h-4 ${width}`} />
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			<div className="ledger-page space-y-8 py-6 md:py-8">
				{/* The inline action row: the completion note, Discard, Finish. */}
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<Skeleton className="h-9 w-full sm:w-72" />
					<div className="flex gap-2">
						<Skeleton className="h-11 w-28 md:h-10" />
						<Skeleton className="h-11 flex-1 sm:w-40 sm:flex-none md:h-10" />
					</div>
				</div>

				{/* Exercises: one ruled list, set rows as wells. */}
				<div className="border-y border-rule">
					{Array.from({ length: exerciseCount }).map((_, exerciseIndex) => (
						<div
							key={exerciseIndex}
							data-testid={`exercise-skeleton-${exerciseIndex}`}
							className="rule-row mark py-4 pl-3"
						>
							<div className="flex items-center justify-between gap-2">
								<div className="flex min-w-0 flex-1 items-center gap-3">
									<Skeleton className="h-4 w-4" />
									<div className="space-y-1.5">
										<Skeleton className="h-5 w-36" />
										<Skeleton className="h-3.5 w-20" />
									</div>
								</div>
								<Skeleton className="h-4 w-16" />
							</div>
							<div className="mt-3 space-y-2">
								{Array.from({ length: setsPerExercise }).map((_, setIndex) => (
									<Skeleton
										key={setIndex}
										data-testid={`set-skeleton-${exerciseIndex}-${setIndex}`}
										className="h-20 w-full"
									/>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
