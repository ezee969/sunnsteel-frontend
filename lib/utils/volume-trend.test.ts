import type { VolumeTrendResponse } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	getSelectedVolumeTrend,
	getVolumeBarPercent,
	getVolumeTrendSeries,
	getVolumeTrendSummary,
} from './volume-trend'

const data: VolumeTrendResponse = {
	timeZone: 'Europe/Berlin',
	weeks: 4,
	overall: [
		{
			weekStart: '2026-08-17',
			isCurrentWeek: false,
			volumeKg: 100,
			completedSets: 2,
		},
		{
			weekStart: '2026-08-24',
			isCurrentWeek: false,
			volumeKg: 200,
			completedSets: 3,
		},
		{
			weekStart: '2026-08-31',
			isCurrentWeek: false,
			volumeKg: 300,
			completedSets: 4,
		},
		{
			weekStart: '2026-09-07',
			isCurrentWeek: true,
			volumeKg: 50,
			completedSets: 1,
		},
	],
	muscles: [
		{
			id: 'PECTORAL',
			name: 'PECTORAL',
			totalVolumeKg: 300,
			totalCompletedSets: 4,
			points: [],
		},
	],
	routines: [],
	exercises: [],
}

describe('volume trend presentation', () => {
	it('compares the latest two complete weeks without treating current as final', () => {
		expect(getVolumeTrendSummary(data.overall)).toEqual({
			totalVolumeKg: 650,
			completedSets: 10,
			latestCompleteWeek: data.overall[2],
			previousCompleteWeek: data.overall[1],
			changePercent: 50,
		})
	})

	it('uses friendly muscle names and falls back to the leading series', () => {
		expect(getVolumeTrendSeries(data, 'muscle')[0].name).toBe('Pecs')
		expect(getSelectedVolumeTrend(data, 'muscle', 'missing').name).toBe('Pecs')
	})

	it('scales visible bars against the selected peak', () => {
		expect(getVolumeBarPercent(300, data.overall)).toBe(100)
		expect(getVolumeBarPercent(50, data.overall)).toBeCloseTo(16.67, 1)
		expect(getVolumeBarPercent(0, data.overall)).toBe(0)
	})
})
