import { describe, it, expect } from 'vitest'
import { generateRepsToFailureProgram, generateRepsToFailureHypertrophyProgram, createInitialRepsToFailureConfig, RepsToFailureConfig, UserPerformance } from '@/lib/utils/reps-to-failure'

function perf(week: number, reps: number): UserPerformance {
	return { week, repsOnLastSet: reps, setsCompleted: 1 }
}

describe('reps-to-failure unified generator', () => {
	it('generates 21 weeks with deloads (standard)', () => {
		const cfg: RepsToFailureConfig = { initialWeight: 100, style: 'STANDARD', withDeloads: true, roundingIncrementKg: 2.5 }
		const logs = generateRepsToFailureProgram(cfg, [])
		expect(logs.length).toBe(21)
		expect(logs[0].week).toBe(1)
		expect(logs.at(-1)?.week).toBe(21)
	})

	it('generates 18 weeks without deloads (standard)', () => {
		const cfg: RepsToFailureConfig = { initialWeight: 100, style: 'STANDARD', withDeloads: false }
		const logs = generateRepsToFailureProgram(cfg, [])
		expect(logs.length).toBe(18)
		expect(new Set(logs.map(l => l.week)).size).toBe(18)
	})

	it('hypertrophy style respects style flag & length', () => {
		const cfg: RepsToFailureConfig = { initialWeight: 80, style: 'HYPERTROPHY', withDeloads: true }
		const logs = generateRepsToFailureProgram(cfg, [])
		expect(logs.length).toBe(21)
		// First week should use 4 sets in hypertrophy vs 5 in standard (goal string contains pattern)
		expect(logs[0].goal.startsWith('4x')).toBe(true)
	})

	it('legacy hypertrophy wrapper works', () => {
		const logs = generateRepsToFailureHypertrophyProgram({ initialWeight: 70 }, [])
		expect(logs.length).toBe(21)
	})

	it('applies TM adjustment based on prior week overperformance', () => {
		const cfg: RepsToFailureConfig = { initialWeight: 100, style: 'STANDARD', withDeloads: true }
		// Provide week1 performance (target AMRAP=10, give 14 reps => +2%)
		const logs = generateRepsToFailureProgram(cfg, [perf(1, 14)])
		// Week2 action should mention adjusted TM
		const week2 = logs[1]
		expect(week2.action).toMatch(/TM adjusted/)
	})

	it('reduces TM when underperforming by 2 reps (−5%)', () => {
		const cfg: RepsToFailureConfig = { initialWeight: 120, style: 'STANDARD', withDeloads: true }
		// Week1 target 10, deliver 8 => -5%
		const logs = generateRepsToFailureProgram(cfg, [perf(1, 8)])
		const wk2 = logs[1]
		expect(wk2.action).toMatch(/-5\.0%/)
	})

	it('reduces TM when underperforming by 1 rep (−2%)', () => {
		const cfg: RepsToFailureConfig = { initialWeight: 150, style: 'STANDARD', withDeloads: true }
		// Week1 target 10, deliver 9 => -2%
		const logs = generateRepsToFailureProgram(cfg, [perf(1, 9)])
		const wk2 = logs[1]
		expect(wk2.action).toMatch(/-2\.0%/)
	})

	it('rounds weights to custom increment', () => {
		const cfg: RepsToFailureConfig = { initialWeight: 103, style: 'STANDARD', withDeloads: true, roundingIncrementKg: 2.5 }
		const logs = generateRepsToFailureProgram(cfg, [])
		// Week1 intensity 0.7 => 72.1 rounded to nearest 2.5 => 72.5
		const w1 = logs[0].weight
		expect(w1 % 2.5).toBe(0)
	})
})
