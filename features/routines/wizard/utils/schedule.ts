import {
	ROUTINE_DAYS_MAX,
	routineDayLabel,
	type RoutineScheduleMode,
} from '@sunsteel/contracts'

import type { Translator } from '@/i18n/translator'
import { routineDayTitle } from '@/lib/utils/routine-schedule'

import type { RoutineWizardData, RoutineWizardDay } from '../types'

/**
 * ROUT-11 wizard state. `slot` is the weekday (0–6) on a weekly routine and
 * the position (0..n-1) on a rotation; `trainingDays` lists the slots in the
 * order the days are shown. Every helper returns the fields to update.
 */

type PresetTranslator = Translator<'routines.presets'>

/**
 * A preset is named by its key, never by its English text: its day names are
 * copied into the draft and become the member's own words from then on, so
 * they arrive in the member's language (the rule starter templates follow).
 */
export interface RotationPreset {
	readonly key: 'pushPullLegs' | 'upperLower' | 'fullBodyAB' | 'upperLowerPPL'
	readonly dayKeys: readonly PresetDayKey[]
}

type PresetDayKey =
	| 'dayPush'
	| 'dayPull'
	| 'dayLegs'
	| 'dayUpper'
	| 'dayLower'
	| 'dayFullBodyA'
	| 'dayFullBodyB'

export const ROTATION_PRESETS: readonly RotationPreset[] = [
	{ key: 'pushPullLegs', dayKeys: ['dayPush', 'dayPull', 'dayLegs'] },
	{ key: 'upperLower', dayKeys: ['dayUpper', 'dayLower'] },
	{ key: 'fullBodyAB', dayKeys: ['dayFullBodyA', 'dayFullBodyB'] },
	{
		key: 'upperLowerPPL',
		dayKeys: ['dayUpper', 'dayLower', 'dayPush', 'dayPull', 'dayLegs'],
	},
]

const PRESET_NAME_KEYS = {
	pushPullLegs: 'pushPullLegsName',
	upperLower: 'upperLowerName',
	fullBodyAB: 'fullBodyABName',
	upperLowerPPL: 'upperLowerPushPullLegsName',
} as const

/** The preset as a member reads it: its name, its day names and its summary. */
export function describeRotationPreset(
	preset: RotationPreset,
	t: PresetTranslator,
): { name: string; days: string[]; description: string } {
	const days = preset.dayKeys.map(key => t(key))
	return {
		name: t(PRESET_NAME_KEYS[preset.key]),
		days,
		description:
			preset.key === 'fullBodyAB'
				? t('fullBodyABDescription')
				: t('daysWithNames', { count: days.length, days: days.join(', ') }),
	}
}

/** Weekdays that rotation days take, in order, when switching to weekly. */
const WEEKLY_FILL_ORDER = [1, 2, 3, 4, 5, 6, 0]

type ScheduleUpdate = Pick<
	RoutineWizardData,
	'scheduleMode' | 'trainingDays' | 'days'
> & { restDays?: number[]; rotationWeekdays?: number[] }

const asRotation = (days: RoutineWizardDay[]): ScheduleUpdate => {
	const renumbered = days.map((day, slot) => ({ ...day, slot }))
	return {
		scheduleMode: 'ROTATION',
		days: renumbered,
		trainingDays: renumbered.map(day => day.slot),
		// Rotations have no rest days (SCHED-07).
		restDays: [],
	}
}

export function wizardDayLabel(
	mode: RoutineScheduleMode,
	day: Pick<RoutineWizardDay, 'slot' | 'name'>,
	index: number,
): string {
	return mode === 'ROTATION'
		? routineDayLabel({ name: day.name, order: index })
		: routineDayLabel({ name: day.name, dayOfWeek: day.slot })
}

/** Weekday plus name on a weekly routine ("Monday · Push"); the label on a rotation. */
export function wizardDayTitle(
	mode: RoutineScheduleMode,
	day: Pick<RoutineWizardDay, 'slot' | 'name'>,
	index: number,
	t: Translator<'routines.date'>,
): string {
	return routineDayTitle(
		{
			dayOfWeek: mode === 'ROTATION' ? null : day.slot,
			name: day.name ?? null,
			order: index,
		},
		'long',
		t,
	)
}

/**
 * Switching keeps every day and its exercises: to a rotation in the order the
 * days are shown, to weekly on Monday, Tuesday… in rotation order.
 */
export function changeScheduleMode(
	data: RoutineWizardData,
	mode: RoutineScheduleMode,
): ScheduleUpdate {
	if (mode === data.scheduleMode) {
		return {
			scheduleMode: mode,
			days: data.days,
			trainingDays: data.trainingDays,
		}
	}
	if (mode === 'ROTATION') {
		// SCHED-06: the weekly routine's weekdays become the rotation's.
		return {
			...asRotation(data.days),
			rotationWeekdays: [...data.trainingDays].sort((a, b) => a - b),
		}
	}
	const days = data.days
		.map((day, index) => ({ ...day, slot: WEEKLY_FILL_ORDER[index] }))
		.sort((a, b) => a.slot - b.slot)
	return {
		scheduleMode: 'WEEKLY',
		days,
		trainingDays: days.map(day => day.slot),
		rotationWeekdays: [],
	}
}

/** SCHED-06: toggles a weekday a rotation trains on; weekly routines have none. */
export function toggleRotationWeekday(
	data: RoutineWizardData,
	weekday: number,
): Pick<RoutineWizardData, 'rotationWeekdays'> {
	if (data.scheduleMode !== 'ROTATION') {
		return { rotationWeekdays: data.rotationWeekdays }
	}
	return {
		rotationWeekdays: data.rotationWeekdays.includes(weekday)
			? data.rotationWeekdays.filter(day => day !== weekday)
			: [...data.rotationWeekdays, weekday].sort((a, b) => a - b),
	}
}

export function addRotationDay(data: RoutineWizardData): ScheduleUpdate {
	if (data.days.length >= ROUTINE_DAYS_MAX) return asRotation(data.days)
	return asRotation([
		...data.days,
		{ slot: data.days.length, name: '', exercises: [] },
	])
}

export function removeRotationDay(
	data: RoutineWizardData,
	slot: number,
): ScheduleUpdate {
	return asRotation(data.days.filter(day => day.slot !== slot))
}

export function moveRotationDay(
	data: RoutineWizardData,
	slot: number,
	direction: -1 | 1,
): ScheduleUpdate {
	const days = [...data.days]
	const from = days.findIndex(day => day.slot === slot)
	const to = from + direction
	if (from < 0 || to < 0 || to >= days.length) return asRotation(days)
	;[days[from], days[to]] = [days[to], days[from]]
	return asRotation(days)
}

/** A preset names the days; exercises already planned stay by position. */
export function applyRotationPreset(
	data: RoutineWizardData,
	preset: RotationPreset,
	t: PresetTranslator,
): ScheduleUpdate {
	return asRotation(
		describeRotationPreset(preset, t).days.map((name, index) => ({
			slot: index,
			name,
			exercises: data.days[index]?.exercises ?? [],
		})),
	)
}

export function isRotationPreset(
	data: RoutineWizardData,
	preset: RotationPreset,
	t: PresetTranslator,
): boolean {
	const days = describeRotationPreset(preset, t).days
	return (
		data.scheduleMode === 'ROTATION' &&
		data.days.length === days.length &&
		data.days.every((day, index) => day.name?.trim() === days[index])
	)
}

/** SCHED-07: toggles a planned rest weekday; training weekdays never rest. */
export function toggleRestDay(
	data: RoutineWizardData,
	weekday: number,
): Pick<RoutineWizardData, 'restDays'> {
	if (data.scheduleMode !== 'WEEKLY' || data.trainingDays.includes(weekday)) {
		return { restDays: data.restDays }
	}
	return {
		restDays: data.restDays.includes(weekday)
			? data.restDays.filter(day => day !== weekday)
			: [...data.restDays, weekday].sort((a, b) => a - b),
	}
}

export function renameWizardDay(
	data: RoutineWizardData,
	slot: number,
	name: string,
): Pick<RoutineWizardData, 'days'> {
	return {
		days: data.days.map(day => (day.slot === slot ? { ...day, name } : day)),
	}
}
