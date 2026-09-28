import { ClassicalLoader } from '@/components/ui/classical-loader'
import { cn } from '@/lib/utils'

/**
 * The dashboard's only loading state: one centred mark, held until every
 * section's data has arrived. A layout-mirroring skeleton was tried first and
 * rejected — it still read as the page assembling itself.
 */
export default function DashboardLoading({
	className,
}: {
	className?: string
}) {
	return (
		<div
			className={cn(
				'flex min-h-[45vh] w-full flex-col items-center justify-center gap-4',
				className,
			)}
			role="status"
			aria-live="polite"
			aria-busy="true"
		>
			<ClassicalLoader size="lg" label="Loading your dashboard" />
			<span className="sr-only">Loading your dashboard…</span>
		</div>
	)
}
