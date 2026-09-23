import type { SetupComparison } from '@/lib/utils/routine-versions'

const DAY_STATUS_WORDS = {
	ADDED: 'New day',
	REMOVED: 'Removed day',
	CHANGED: null,
} as const

export function RoutineSetupComparison({
	comparison,
}: {
	comparison: SetupComparison
}) {
	if (comparison.isEmpty) {
		return (
			<p className="type-body-sm text-ink-2">
				This setup matches the routine as it is now.
			</p>
		)
	}

	return (
		<div className="space-y-4">
			{comparison.routine.length ? (
				<ul className="type-body-sm space-y-1 text-ink-2">
					{comparison.routine.map(change => (
						<li key={change}>{change}</li>
					))}
				</ul>
			) : null}
			{comparison.days.map(day => (
				<section
					key={`${day.status}-${day.title}`}
					className="rule-row space-y-1 pt-3"
				>
					<h3 className="type-panel text-foreground">
						{day.title}
						{DAY_STATUS_WORDS[day.status] ? (
							<span className="type-body-sm ml-2 text-ink-3">
								{DAY_STATUS_WORDS[day.status]}
							</span>
						) : null}
					</h3>
					<ul className="type-body-sm space-y-1 text-ink-2">
						{day.changes.map(change => (
							<li key={change}>{change}</li>
						))}
					</ul>
				</section>
			))}
		</div>
	)
}
