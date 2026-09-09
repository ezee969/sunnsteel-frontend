import { ClassicalIcon } from '@/components/icons/ClassicalIcon'
import { cn } from '@/lib/utils'
import { formatDaysPerWeek } from '@/lib/utils/routine-format'

interface RoutineMetaBadgesProps {
	daysPerWeek: number
	isPeriodized?: boolean
	className?: string
}

/**
 * Frequency, and whether the routine is periodized.
 *
 * Both were outlined badges. v1.0 §11.12 reserves a bounded box for editable
 * fields, so read-only facts about a routine are set in Space Mono on the row
 * ground instead — which also stops two boxes competing with the row's Start
 * control for attention.
 */
export function RoutineMetaBadges({
	daysPerWeek,
	isPeriodized,
	className,
}: RoutineMetaBadgesProps) {
	return (
		<p
			className={cn(
				'type-data flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-2',
				className,
			)}
		>
			<ClassicalIcon
				name="dumbbell"
				className="h-3.5 w-3.5 flex-shrink-0 text-ink-3"
				aria-hidden
			/>
			<span>{formatDaysPerWeek(daysPerWeek)}</span>
			{isPeriodized && (
				<>
					<span aria-hidden className="text-ink-3">
						·
					</span>
					<span>Periodized</span>
				</>
			)}
		</p>
	)
}
