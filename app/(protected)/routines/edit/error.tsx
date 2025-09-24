'use client'

interface RoutineEditErrorProps {
	error: Error & { digest?: string }
	reset: () => void
}

export default function RoutineEditError({ error, reset }: RoutineEditErrorProps) {
	return (
		<div className="p-6 space-y-4 max-w-xl mx-auto">
			<div className="space-y-2">
				<h2 className="text-xl font-semibold">Edit Routine Error</h2>
				<p className="text-sm text-muted-foreground">
					Failed to load or save routine changes. Your data should be preserved.
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
					Retry Edit
				</button>
				<button
					className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted transition-colors"
					onClick={() => window.location.href = '/routines'}
				>
					Back to Routines
				</button>
			</div>
		</div>
	);
}