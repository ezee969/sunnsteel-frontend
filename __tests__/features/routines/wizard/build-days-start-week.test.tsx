import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/__tests__/utils';
import { BuildDays } from '@/features/routines/wizard/BuildDays';
import type { RoutineWizardData } from '@/features/routines/wizard/types';

describe('BuildDays - Start Week Selector', () => {
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
            programTMKg: 100,
            programRoundingKg: 2.5,
            sets: [
              { setNumber: 1, repType: 'FIXED', reps: 5, minReps: null, maxReps: null, weight: undefined },
            ],
          },
        ],
      },
    ],
    programScheduleMode: 'TIMEFRAME',
    programWithDeloads: true,
    programStartDate: '2025-09-01',
    programTimezone: 'America/New_York',
    programStartWeek: 1,
    ...override,
  });

  let onUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onUpdate = vi.fn();
  });

  it('shows start week selector when RtF exercises exist and not editing', () => {
    render(<BuildDays data={makeData()} onUpdate={onUpdate} />);
    expect(screen.getByLabelText(/Program start week/i)).toBeInTheDocument();
  });

  it('hides start week selector when editing', () => {
    render(<BuildDays data={makeData()} onUpdate={onUpdate} isEditing />);
    expect(screen.queryByLabelText(/Program start week/i)).not.toBeInTheDocument();
  });

  it('hides start week selector when no RtF exercises exist', () => {
    const data = makeData({
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
    });
    render(<BuildDays data={data} onUpdate={onUpdate} />);
    expect(screen.queryByLabelText(/Program start week/i)).not.toBeInTheDocument();
  });

  it('shows start week selector for RtF Hypertrophy exercises', () => {
    const data = makeData({
      days: [
        {
          dayOfWeek: 1,
          exercises: [
            {
              exerciseId: 'e1',
              progressionScheme: 'PROGRAMMED_RTF_HYPERTROPHY',
              minWeightIncrement: 2.5,
              restSeconds: 120,
              programTMKg: 100,
              programRoundingKg: 2.5,
              sets: [
                { setNumber: 1, repType: 'FIXED', reps: 10, minReps: null, maxReps: null, weight: undefined },
              ],
            },
          ],
        },
      ],
    });
    render(<BuildDays data={data} onUpdate={onUpdate} />);
    expect(screen.getByLabelText(/Program start week/i)).toBeInTheDocument();
  });

  it('updates programStartWeek when selector changes', () => {
    render(<BuildDays data={makeData()} onUpdate={onUpdate} />);
    
    const selector = screen.getByLabelText(/Program start week/i);
    fireEvent.click(selector);
    
    // The select should be opened, find option for week 5
    const week5Option = screen.getByText(/Week 5 of 21/i);
    fireEvent.click(week5Option);

    expect(onUpdate).toHaveBeenCalledWith({
      programStartWeek: 5,
      programStartWeekExplicit: true,
    });
  });

  it('displays correct total weeks based on deload setting (21 with deloads)', () => {
    render(<BuildDays data={makeData({ programWithDeloads: true })} onUpdate={onUpdate} />);
    expect(screen.getByText(/21-week program/i)).toBeInTheDocument();
  });

  it('displays correct total weeks based on deload setting (18 without deloads)', () => {
    render(<BuildDays data={makeData({ programWithDeloads: false })} onUpdate={onUpdate} />);
    expect(screen.getByText(/18-week program/i)).toBeInTheDocument();
  });
});
