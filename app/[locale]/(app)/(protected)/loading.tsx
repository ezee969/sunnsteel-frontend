import { Skeleton } from '@/components/ui/skeleton'

/**
 * Route-level fallback for the protected shell, on the shell's own ground. The
 * parchment texture and gold vignette it used to lay underneath were gradients
 * (§4.3 rule 6) and gold that marked nothing earned (rule 3).
 */
export default function Loading() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-lg space-y-3 p-6">
				<Skeleton className="h-6 w-40" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-4 w-5/6" />
				<Skeleton className="h-4 w-2/3" />
			</div>
		</div>
	)
}
