'use client'

import { useLocale, useTranslations } from 'next-intl'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Locale } from '@/i18n/config'
import { describeEndTime, toDateTimeLocal } from '@/lib/utils/workout-end-time'

/**
 * LIVE-24: when the workout ended, as a local date and time to the minute.
 * The bounds are the minute of the earliest end and the latest one; the
 * caller decides what a value outside them means.
 */
export function WorkoutEndTimeField({
	id,
	label,
	note,
	value,
	onChange,
	earliest,
	latest,
	startedAt,
	lastSet,
	problem,
}: {
	id: string
	label: string
	/** One line above the field, when the field needs a reason to be there. */
	note?: string
	value: string
	onChange: (value: string) => void
	earliest: Date
	latest: Date
	startedAt: string
	/** The last completed set, which the hint names; null before the first. */
	lastSet: Date | null
	problem?: string | null
}) {
	const t = useTranslations('workout.endTime')
	const locale = useLocale() as Locale
	const hintId = `${id}-hint`
	const errorId = `${id}-error`
	return (
		<div className="space-y-2">
			{note ? <p className="type-body-sm text-ink-2">{note}</p> : null}
			<Label htmlFor={id}>{label}</Label>
			<Input
				id={id}
				type="datetime-local"
				value={value}
				min={toDateTimeLocal(earliest)}
				max={toDateTimeLocal(latest)}
				onChange={event => onChange(event.target.value)}
				aria-invalid={problem ? true : undefined}
				aria-describedby={problem ? `${hintId} ${errorId}` : hintId}
				className="sm:w-64"
			/>
			<p id={hintId} className="type-body-sm text-ink-3">
				{describeEndTime({ startedAt, lastSet, value }, locale, t)}
			</p>
			{problem ? (
				<p id={errorId} role="alert" className="type-body-sm text-destructive">
					{problem}
				</p>
			) : null}
		</div>
	)
}
