import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface LoadingRowsProps {
	/** What is loading, said once to assistive technology. */
	label: string
	rows?: number
	className?: string
}

/**
 * UX-26 (design system §28.6): the one way a list says it is loading -- the
 * ruled rows it will become, each a title and a summary line, announced once
 * as a status. It replaces plain "Loading…" lines, spinners and each list's
 * own skeleton, so a page never changes shape between loading and loaded.
 */
export function LoadingRows({ label, rows = 5, className }: LoadingRowsProps) {
	return (
		<div
			role="status"
			aria-busy="true"
			className={cn('border-t border-rule', className)}
		>
			<span className="sr-only">{label}</span>
			{Array.from({ length: rows }).map((_, index) => (
				<div key={index} aria-hidden className="rule-row py-3 pl-3 pr-1">
					<Skeleton className="h-4 w-56 max-w-full" />
					<Skeleton className="mt-2 h-3 w-72 max-w-full" />
				</div>
			))}
		</div>
	)
}
