import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/__tests__/utils';
import { TrainingDays } from '@/features/routines/wizard/TrainingDays';
import type { RoutineWizardData } from '@/features/routines/wizard/types';

describe('TrainingDays - Basic functionality', () => {
  const makeData = (override?: Partial<RoutineWizardData>): RoutineWizardData => ({
    name: 'Routine',
    description: '',
    trainingDays: [1], // Monday
    days: [
      {
        dayOfWeek: 1,
        exercises: [
          {
            exerciseId: 'e1',
            progressionScheme: 'DOUBLE_PROGRESSION',
            minWeightIncrement: 2.5,
            restSeconds: 120,
            sets: [
              { setNumber: 1, repType: 'FIXED', reps: 10, minReps: null, maxReps: null, weight: undefined },
            ],
          },
        ],
      },
    ],
    ...override,
  });

  let onUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onUpdate = vi.fn();
  });

  it('renders training days selection interface', () => {
    render(<TrainingDays data={makeData()} onUpdate={onUpdate} />);
    // Should show common split options (there are multiple PPL variants)
    const pplOptions = screen.getAllByText(/Push\/Pull\/Legs/i);
    expect(pplOptions.length).toBeGreaterThan(0);
  });

  // Note: RtF-specific UI (program settings panel, weekday hints, deload weeks toggle, start week selector)
  // were moved to RtfConfiguration component (Step 4) where users configure their RtF program
  // after choosing exercise progressions. Tests for these features are in rtf-configuration.test.tsx.
});
