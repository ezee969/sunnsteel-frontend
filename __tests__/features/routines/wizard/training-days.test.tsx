import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/__tests__/utils';
import { TrainingDays } from '@/features/routines/wizard/TrainingDays';
import type { RoutineWizardData } from '@/features/routines/wizard/types';

describe('TrainingDays - RtF panel, weekday hint', () => {
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
            progressionScheme: 'PROGRAMMED_RTF',
            minWeightIncrement: 2.5,
            restSeconds: 120,
            sets: [
              { setNumber: 1, repType: 'RANGE', minReps: 8, maxReps: 12, reps: null, weight: undefined },
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

  it('shows RtF Program Settings panel when any exercise uses RtF', () => {
    render(<TrainingDays data={makeData()} onUpdate={onUpdate} />);
    expect(screen.getByText(/RtF Program Settings/i)).toBeInTheDocument();
  });

  it('shows weekday mismatch hint when start date weekday != first training day', () => {
    // trainingDays[0] is Monday (1); choose a Tuesday (2) date
    const data = makeData({ programStartDate: '2025-09-02' });
    render(<TrainingDays data={data} onUpdate={onUpdate} />);

    expect(
      screen.getByText(/Warning: start date is/i)
    ).toBeInTheDocument();
  });

  it('shows ok hint when start date weekday == first training day', () => {
    // Monday 2025-09-01
    const data = makeData({ programStartDate: '2025-09-01' });
    render(<TrainingDays data={data} onUpdate={onUpdate} />);

    expect(
      screen.getByText(/Start date falls on your first training day/i)
    ).toBeInTheDocument();
  });

  it('shows Start Program Week select on create for RtF and hides it on edit', () => {
    const data = makeData();
    const { rerender } = render(
      <TrainingDays data={data} onUpdate={onUpdate} />
    );

    expect(
      screen.getByLabelText(/Program start week/i)
    ).toBeInTheDocument();

    rerender(<TrainingDays data={data} onUpdate={onUpdate} isEditing />);
    expect(
      screen.queryByLabelText(/Program start week/i)
    ).not.toBeInTheDocument();
  });

  it('defaults programStartWeek to 1 when RtF is used and unset', async () => {
    render(
      <TrainingDays data={makeData({ programStartWeek: undefined })} onUpdate={onUpdate} />
    );

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ programStartWeek: 1 })
      );
    });
  });

  it('clamps programStartWeek when deloads toggled off (21 -> 18)', () => {
    const data = makeData({ programWithDeloads: true, programStartWeek: 21 });
    render(<TrainingDays data={data} onUpdate={onUpdate} />);

    // Toggle off deloads
    fireEvent.click(screen.getByLabelText(/Include deload weeks/i));

    // Should clamp to 18
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ programWithDeloads: false, programStartWeek: 18 })
    );
  });
});
