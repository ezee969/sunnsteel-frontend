import { describe, it, expect } from 'vitest';
import {
  generateRepsToFailureHypertrophyProgram,
  weeklyGoalDataHypertrophy,
} from '@/lib/utils/reps-to-failure';

describe('Reps to Failure (Hypertrophy) program', () => {
  it('generates week 1 with 4 sets and AMRAP target, using rounded weight', () => {
    const logs = generateRepsToFailureHypertrophyProgram({ initialWeight: 100 }, []);
    const w1 = logs.find((l) => l.week === 1)!;
    expect(w1.weight).toBe(70); // 100 * 0.7 -> 70, rounded to nearest 5 stays 70
    const spec = weeklyGoalDataHypertrophy.find((g) => g.week === 1)!;
    expect(w1.goal).toBe(`${spec.sets}x${spec.reps} (last set AMRAP ${spec.amrapTarget}+)`);
  });

  it('formats deload week with 60% and no rep targets', () => {
    const logs = generateRepsToFailureHypertrophyProgram({ initialWeight: 100 }, []);
    const w7 = logs.find((l) => l.week === 7)!;
    expect(w7.weight).toBe(60); // 100 * 0.6
    expect(w7.goal).toMatch(/no rep targets/);
  });

  it('applies TM increase based on overperformance (e.g., +1.5% for +3 reps)', () => {
    const perf = [
      { week: 1, repsOnLastSet: 15, setsCompleted: 4 }, // target is 12 -> +3 reps => +1.5%
    ];
    const logs = generateRepsToFailureHypertrophyProgram({ initialWeight: 100 }, perf);
    const w2 = logs.find((l) => l.week === 2)!;
    const expectedTM = 100 * 1.015;
    const intensity = weeklyGoalDataHypertrophy.find((g) => g.week === 2)!.intensity!;
    const expectedW2 = Math.round((expectedTM * intensity) / 5) * 5; // round to nearest 5
    expect(w2.weight).toBe(expectedW2);
  });
});
