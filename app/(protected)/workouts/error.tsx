'use client'

interface WorkoutsErrorProps {
	error: Error & { digest?: string }
	reset: () => void
}

export default function WorkoutsError({ error, reset }: WorkoutsErrorProps) {
	return (
		<div className="p-6 space-y-4 max-w-xl">
			<h2 className="text-xl font-semibold">Failed to load workouts</h2>
			<p className="text-sm text-muted-foreground break-all">{error.message}</p>
			<div className="flex gap-2">
				<button
					className="text-sm underline underline-offset-4 hover:text-primary"
					onClick={() => reset()}
				>
					Retry
				</button>
				<button
					className="text-sm underline underline-offset-4 hover:text-primary"
					onClick={() => window.location.reload()}
				>
					Hard reload
				</button>
			</div>
		</div>
	)
}
