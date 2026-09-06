import { CalendarDays, CircleAlert, ListChecks } from 'lucide-react'

import { cn } from '@/lib/utils'
import { describeDaysAway } from '@/lib/utils/date'

interface RoutineScheduleNoteProps {
	// Manual "mark as completed" flag from the routine record
	isCompleted: boolean
	// Soonest upcoming training day, from `nextScheduledDay`
	nextDay: { dayOfWeek: number; daysAway: number } | null
	className?: string
}

/**
 * One-line status for a routine card: whether it is archived as completed, and
 * otherwise when it next trains.
 *
 * This replaced a progress bar that rendered `isCompleted` as a percentage.
 * `isCompleted` is a manual archive toggle, not an adherence figure, so an
 * in-use routine always read "Completion 0%" no matter how many sessions had
 * been logged against it. No per-routine completion ratio exists in the API
 * (`Routine` in `@sunsteel/contracts` carries no session counts and no program
 * length), so the card shows schedule information it can actually derive
 * instead of a number it cannot.
 *
 * @param isCompleted - Whether the routine is marked completed.
 * @param nextDay - Next scheduled day, or `null` when none are configured.
 * @param className - Optional wrapper class name.
 */
export function RoutineScheduleNote({
	isCompleted,
	nextDay,
	className,
}: RoutineScheduleNoteProps) {
	const { Icon, label, value, tone } = (() => {
		if (isCompleted) {
			return {
				Icon: ListChecks,
				label: 'Status',
				value: 'Completed',
				tone: 'text-emerald-600 dark:text-emerald-500',
			}
		}
		if (!nextDay) {
			return {
				Icon: CircleAlert,
				label: 'Schedule',
				value: 'No training days',
				tone: 'text-muted-foreground',
			}
		}
		return {
			Icon: CalendarDays,
			label: 'Next session',
			value: describeDaysAway(nextDay.dayOfWeek, nextDay.daysAway),
			tone:
				nextDay.daysAway === 0
					? 'text-amber-600 dark:text-amber-400'
					: 'text-foreground/80',
		}
	})()

	return (
		<div
			className={cn(
				'flex items-center justify-between gap-2 text-xs text-muted-foreground',
				className,
			)}
		>
			<span className="flex items-center gap-1.5">
				<Icon className={cn('h-3.5 w-3.5 flex-shrink-0', tone)} aria-hidden />
				<span>{label}</span>
			</span>
			<span className={cn('font-medium', tone)}>{value}</span>
		</div>
	)
}
