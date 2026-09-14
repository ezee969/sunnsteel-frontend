import { describe, expect, it } from 'vitest'

import type { RoutineWizardData } from '../types'
import { buildRoutineRequest } from './routine-summary'
import {
	addRotationDay,
	applyRotationPreset,
	changeScheduleMode,
	isRotationPreset,
	moveRotationDay,
	removeRotationDay,
	renameWizardDay,
	ROTATION_PRESETS,
	toggleRestDay,
	wizardDayLabel,
} from './schedule'

const exercise = (exerciseId: string) => ({
	exerciseId,
	progressionScheme: 'NONE' as const,
	minWeightIncrement: 2.5,
	restSeconds: 90,
	sets: [],
})

const weekly: RoutineWizardData = {
	name: 'Split',
	scheduleMode: 'WEEKLY',
	trainingDays: [1, 3, 5],
	restDays: [0, 6],
	days: [
		{ slot: 1, name: 'Push', exercises: [exercise('bench')] },
		{ slot: 3, exercises: [exercise('row')] },
		{ slot: 5, exercises: [exercise('squat')] },
	],
}

describe('wizard schedule', () => {
	it('labels days by name, weekday or rotation letter', () => {
		expect(wizardDayLabel('WEEKLY', { slot: 3 }, 1)).toBe('Wednesday')
		expect(wizardDayLabel('WEEKLY', { slot: 1, name: 'Push' }, 0)).toBe('Push')
		expect(wizardDayLabel('ROTATION', { slot: 2, name: '  ' }, 2)).toBe('Day C')
	})

	it('switches modes without losing days or exercises', () => {
		const rotation = { ...weekly, ...changeScheduleMode(weekly, 'ROTATION') }
		expect(rotation.trainingDays).toEqual([0, 1, 2])
		expect(rotation.days.map(d => [d.slot, d.exercises[0].exerciseId])).toEqual(
			[
				[0, 'bench'],
				[1, 'row'],
				[2, 'squat'],
			],
		)
		const back = { ...rotation, ...changeScheduleMode(rotation, 'WEEKLY') }
		expect(back.trainingDays).toEqual([1, 2, 3])
		expect(back.days.map(d => d.exercises[0].exerciseId)).toEqual([
			'bench',
			'row',
			'squat',
		])
		expect(back.days[0].name).toBe('Push')
	})

	it('adds, moves and removes rotation days, renumbering positions', () => {
		const rotation = { ...weekly, ...changeScheduleMode(weekly, 'ROTATION') }
		const added = { ...rotation, ...addRotationDay(rotation) }
		expect(added.trainingDays).toEqual([0, 1, 2, 3])
		const moved = { ...added, ...moveRotationDay(added, 0, 1) }
		expect(moved.days.map(d => d.exercises[0]?.exerciseId ?? null)).toEqual([
			'row',
			'bench',
			'squat',
			null,
		])
		expect(moveRotationDay(moved, 0, -1).days).toEqual(moved.days)
		const removed = { ...moved, ...removeRotationDay(moved, 1) }
		expect(removed.days.map(d => [d.slot, d.exercises[0]?.exerciseId])).toEqual(
			[
				[0, 'row'],
				[1, 'squat'],
				[2, undefined],
			],
		)
		let full = removed
		for (let i = 0; i < 10; i += 1) full = { ...full, ...addRotationDay(full) }
		expect(full.days).toHaveLength(7)
	})

	it('applies a preset by name and keeps exercises by position', () => {
		const rotation = { ...weekly, ...changeScheduleMode(weekly, 'ROTATION') }
		const [ppl, upperLower] = ROTATION_PRESETS
		const withPreset = {
			...rotation,
			...applyRotationPreset(rotation, upperLower),
		}
		expect(
			withPreset.days.map(d => [d.name, d.exercises[0].exerciseId]),
		).toEqual([
			['Upper', 'bench'],
			['Lower', 'row'],
		])
		expect(isRotationPreset(withPreset, upperLower)).toBe(true)
		expect(isRotationPreset(withPreset, ppl)).toBe(false)
		expect(renameWizardDay(withPreset, 0, 'Upper A').days[0].name).toBe(
			'Upper A',
		)
	})

	it('sends weekdays for weekly days and none for rotation days', () => {
		const request = buildRoutineRequest(weekly)
		expect(request.scheduleMode).toBe('WEEKLY')
		expect(request.days.map(d => [d.dayOfWeek, d.name, d.order])).toEqual([
			[1, 'Push', 0],
			[3, null, 1],
			[5, null, 2],
		])
		const rotation = { ...weekly, ...changeScheduleMode(weekly, 'ROTATION') }
		expect(
			buildRoutineRequest(rotation).days.map(d => [d.dayOfWeek, d.order]),
		).toEqual([
			[null, 0],
			[null, 1],
			[null, 2],
		])
	})

	it('keeps rest days off training days and clears them for rotations', () => {
		expect(toggleRestDay(weekly, 3).restDays).toEqual([0, 6])
		expect(toggleRestDay(weekly, 2).restDays).toEqual([0, 2, 6])
		expect(toggleRestDay(weekly, 6).restDays).toEqual([0])
		const rotation = { ...weekly, ...changeScheduleMode(weekly, 'ROTATION') }
		expect(rotation.restDays).toEqual([])
		expect(toggleRestDay(rotation, 2).restDays).toEqual([])
		expect(buildRoutineRequest(weekly).restDays).toEqual([0, 6])
		expect(buildRoutineRequest(rotation).restDays).toEqual([])
	})
})
