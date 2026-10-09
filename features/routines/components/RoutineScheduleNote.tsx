import { Archive, CalendarDays, CircleAlert, Repeat } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'
import { describeDaysAway } from '@/lib/utils/date'

interface RoutineScheduleNoteProps {
	// Manual "mark as completed" flag from the routine record
	isCompleted: boolean
	// Soonest upcoming training day, from `nextScheduledDay`
	nextDay: { dayOfWeek: number; daysAway: number } | null
	// ROUT-11: the label of a rotation's next day; rotations have no weekday
	rotationNext?: string | null
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
	rotationNext,
	className,
}: RoutineScheduleNoteProps) {
	const t = useTranslations('routines.card')
	const tDate = useTranslations('routines.date')
	// v1.0 §4.3: completion is `--success` and nothing else; "today" is neither
	// completion nor honour, so it is emphasised with ink rather than gold. A
	// routine with no training days is a risk, and warning has no text grade
	// (rule 4) — the glyph carries `--warning-strong`, the words stay in ink.
	const { Icon, label, value, iconTone, valueTone } = (() => {
		if (isCompleted) {
			return {
				// UX-25: archived is not "completed as planned", so it takes no
				// success colour -- an ink glyph and the word.
				Icon: Archive,
				label: t('statusLabel'),
				value: t('completedValue'),
				iconTone: 'text-ink-3',
				valueTone: 'text-ink-2',
			}
		}
		if (rotationNext) {
			return {
				Icon: Repeat,
				label: t('nextInRotationLabel'),
				value: rotationNext,
				iconTone: 'text-ink-3',
				valueTone: 'text-foreground',
			}
		}
		if (!nextDay) {
			return {
				Icon: CircleAlert,
				label: t('scheduleLabel'),
				value: t('noTrainingDays'),
				iconTone: 'text-warning-strong',
				valueTone: 'text-ink-2',
			}
		}
		return {
			Icon: CalendarDays,
			label: t('nextSessionLabel'),
			value: describeDaysAway(nextDay.dayOfWeek, nextDay.daysAway, tDate),
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
