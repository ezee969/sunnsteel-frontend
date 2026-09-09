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
	// v1.0 §4.3: completion is `--success` and nothing else; "today" is neither
	// completion nor honour, so it is emphasised with ink rather than gold. A
	// routine with no training days is a risk, and warning has no text grade
	// (rule 4) — the glyph carries `--warning-strong`, the words stay in ink.
	const { Icon, label, value, iconTone, valueTone } = (() => {
		if (isCompleted) {
			return {
				Icon: ListChecks,
				label: 'Status',
				value: 'Completed',
				iconTone: 'text-success',
				valueTone: 'text-success',
			}
		}
		if (!nextDay) {
			return {
				Icon: CircleAlert,
				label: 'Schedule',
				value: 'No training days',
				iconTone: 'text-warning-strong',
				valueTone: 'text-ink-2',
			}
		}
		return {
			Icon: CalendarDays,
			label: 'Next session',
			value: describeDaysAway(nextDay.dayOfWeek, nextDay.daysAway),
			iconTone: 'text-ink-3',
			valueTone: nextDay.daysAway === 0 ? 'text-foreground' : 'text-ink-2',
		}
	})()

	return (
		<div
			className={cn(
				'flex items-center justify-between gap-2 text-ink-3',
				className,
			)}
		>
			<span className="type-body-sm flex items-center gap-1.5">
				<Icon
					className={cn('h-3.5 w-3.5 flex-shrink-0', iconTone)}
					aria-hidden
				/>
				<span>{label}</span>
			</span>
			<span className={cn('type-data', valueTone)}>{value}</span>
		</div>
	)
}
