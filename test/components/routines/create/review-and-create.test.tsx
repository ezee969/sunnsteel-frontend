import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import type { RoutineWizardData } from '@/components/routines/create/types';
import { ReviewAndCreate } from '@/components/routines/create/ReviewAndCreate';

// Mocks
const createSpy = vi.fn();

vi.mock('@/lib/api/hooks/useExercises', () => ({
  useExercises: () => ({
    data: [
      {
        id: 'e1',
        name: 'Bench Press',
        primaryMuscles: ['PECTORAL'],
        secondaryMuscles: ['ANTERIOR_DELTOIDS', 'TRICEPS'],
        equipment: 'Barbell',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ],
  }),
}));

vi.mock('@/lib/api/hooks/useRoutines', () => ({
  useCreateRoutine: () => ({ isPending: false, mutateAsync: createSpy }),
  useUpdateRoutine: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

describe('ReviewAndCreate - RtF payload mapping', () => {
  beforeEach(() => {
    createSpy.mockReset();
  });

  it('maps PROGRAMMED_RTF_HYPERTROPHY to PROGRAMMED_RTF in payload and includes per-exercise RtF fields', async () => {
    const data: RoutineWizardData = {
      name: 'H-RtF Routine',
      description: '',
      trainingDays: [1],
      days: [
        {
          dayOfWeek: 1,
          exercises: [
            {
              exerciseId: 'e1',
              progressionScheme: 'PROGRAMMED_RTF_HYPERTROPHY',
              minWeightIncrement: 2.5,
              restSeconds: 120,
              programTMKg: 110,
              programRoundingKg: 2.5,
              sets: [
                { setNumber: 1, repType: 'RANGE', reps: null, minReps: 8, maxReps: 12, weight: undefined },
              ],
            },
          ],
        },
      ],
      programWithDeloads: true,
      programStartDate: '2025-09-08',
      programTimezone: 'America/New_York',
    };

    render(<ReviewAndCreate data={data} onComplete={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /create routine/i }));

    const payload = createSpy.mock.calls[0][0];
    const ex = payload.days[0].exercises[0];
    expect(ex.progressionScheme).toBe('PROGRAMMED_RTF');
    expect(ex).toEqual(
      expect.objectContaining({ programTMKg: 110, programRoundingKg: 2.5 })
    );
  });

  it('falls back to browser timezone when RtF is used and programTimezone is missing', async () => {
    const tzSpy = vi
      .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
      // @ts-expect-error partial mock
      .mockReturnValue({ timeZone: 'America/Los_Angeles' });

    const missingTz: RoutineWizardData = {
      ...baseData,
      programTimezone: undefined,
    };

    render(<ReviewAndCreate data={missingTz} onComplete={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /create routine/i }));

    expect(createSpy).toHaveBeenCalledTimes(1);
    const payload = createSpy.mock.calls[0][0];
    expect(payload).toEqual(
      expect.objectContaining({ programTimezone: 'America/Los_Angeles' })
    );

    tzSpy.mockRestore();
  });

  const baseData: RoutineWizardData = {
    name: 'My Routine',
    description: '',
    trainingDays: [1],
    days: [
      {
        dayOfWeek: 1,
        exercises: [
          {
            exerciseId: 'e1',
            progressionScheme: 'PROGRAMMED_RTF',
            minWeightIncrement: 2.5,
            restSeconds: 120,
            programTMKg: 100,
            programRoundingKg: 2.5,
            sets: [
              { setNumber: 1, repType: 'RANGE', reps: null, minReps: 8, maxReps: 12, weight: undefined },
            ],
          },
        ],
      },
    ],
    programWithDeloads: true,
    programStartDate: '2025-09-08',
    programTimezone: 'America/New_York',
  };

  it('includes routine-level and per-exercise RtF fields when PROGRAMMED_RTF is used', async () => {
    render(<ReviewAndCreate data={baseData} onComplete={() => {}} />);

    // Click create
    fireEvent.click(screen.getByRole('button', { name: /create routine/i }));

    expect(createSpy).toHaveBeenCalledTimes(1);
    const payload = createSpy.mock.calls[0][0];

    expect(payload).toEqual(
      expect.objectContaining({
        name: 'My Routine',
        isPeriodized: false,
        programWithDeloads: true,
        programStartDate: '2025-09-08',
        programTimezone: 'America/New_York',
        days: expect.arrayContaining([
          expect.objectContaining({
            dayOfWeek: 1,
            exercises: expect.arrayContaining([
              expect.objectContaining({
                exerciseId: 'e1',
                progressionScheme: 'PROGRAMMED_RTF',
                minWeightIncrement: 2.5,
                programTMKg: 100,
                programRoundingKg: 2.5,
                sets: expect.arrayContaining([
                  expect.objectContaining({ setNumber: 1, repType: 'RANGE', minReps: 8, maxReps: 12 }),
                ]),
              }),
            ]),
          }),
        ]),
      })
    );
  });

  it('omits RtF fields when no exercise uses PROGRAMMED_RTF', async () => {
    const nonRtfData: RoutineWizardData = {
      ...baseData,
      days: [
        {
          dayOfWeek: 1,
          exercises: [
            {
              exerciseId: 'e1',
              progressionScheme: 'NONE',
              minWeightIncrement: 2.5,
              restSeconds: 120,
              sets: [
                { setNumber: 1, repType: 'RANGE', reps: null, minReps: 8, maxReps: 12, weight: undefined },
              ],
            },
          ],
        },
      ],
      programWithDeloads: undefined,
      programStartDate: undefined,
      programTimezone: undefined,
    };

    render(<ReviewAndCreate data={nonRtfData} onComplete={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /create routine/i }));

    expect(createSpy).toHaveBeenCalledTimes(1);
    const payload = createSpy.mock.calls[0][0];

    expect(payload).toEqual(
      expect.objectContaining({
        name: 'My Routine',
        isPeriodized: false,
        days: expect.any(Array),
      })
    );
    expect(payload).not.toHaveProperty('programWithDeloads');
    expect(payload).not.toHaveProperty('programStartDate');
    expect(payload).not.toHaveProperty('programTimezone');

    // Ensure per-exercise RtF fields are omitted
    const ex = payload.days[0].exercises[0];
    expect(ex).not.toHaveProperty('programTMKg');
    expect(ex).not.toHaveProperty('programRoundingKg');
  });
});
