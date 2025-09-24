'use client'

interface WorkoutSessionErrorProps {
	error: Error & { digest?: string }
	reset: () => void
}

export default function WorkoutSessionError({ error, reset }: WorkoutSessionErrorProps) {
	return (
		<div className="p-6 space-y-4 max-w-xl mx-auto">
			<div className="space-y-2">
				<h2 className="text-xl font-semibold">Workout Session Error</h2>
				<p className="text-sm text-muted-foreground">
					Something went wrong with your workout session. Your progress should be saved.
				</p>
			</div>
			
			<div className="bg-muted/50 p-3 rounded-md">
				<p className="text-xs text-muted-foreground break-all font-mono">
					{error.message}
				</p>
			</div>
			
			<div className="flex gap-3">
				<button
					className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
					onClick={() => reset()}
				>
					Retry Session
				</button>
				<button
					className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted transition-colors"
					onClick={() => window.location.href = '/workouts'}
				>
					Back to Workouts
				</button>
			</div>
		</div>
	);
}