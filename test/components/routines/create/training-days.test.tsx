import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { TrainingDays } from '@/components/routines/create/TrainingDays';
import type { RoutineWizardData } from '@/components/routines/create/types';

describe('TrainingDays - RtF panel, timezone autofill, weekday hint', () => {
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
    expect(screen.getByLabelText(/Program start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Program timezone/i)).toBeInTheDocument();
  });

  it('auto-fills timezone from browser when missing and RtF is used', async () => {
    const spy = vi
      .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
      .mockReturnValue({ timeZone: 'America/New_York' } as any);

    render(<TrainingDays data={makeData({ programTimezone: undefined })} onUpdate={onUpdate} />);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ programTimezone: 'America/New_York' })
      );
    });

    spy.mockRestore();
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
});
