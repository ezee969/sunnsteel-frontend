import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/__tests__/utils';
import { RtfConfiguration } from '@/features/routines/wizard/RtfConfiguration';
import type { RoutineWizardData } from '@/features/routines/wizard/types';

describe('RtfConfiguration - RtF Program Settings', () => {
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

  it('renders RtF configuration header', () => {
    render(<RtfConfiguration data={makeData()} onUpdate={onUpdate} />);
    expect(screen.getByText(/RtF Program Configuration/i)).toBeInTheDocument();
  });

  it('shows deload weeks checkbox', () => {
    render(<RtfConfiguration data={makeData()} onUpdate={onUpdate} />);
    expect(screen.getByLabelText(/Include deload weeks/i)).toBeInTheDocument();
  });

  it('shows 21-week program description when deloads enabled', () => {
    render(<RtfConfiguration data={makeData({ programWithDeloads: true })} onUpdate={onUpdate} />);
    expect(screen.getByText(/21-week program with deload weeks/i)).toBeInTheDocument();
  });

  it('shows 18-week program description when deloads disabled', () => {
    render(<RtfConfiguration data={makeData({ programWithDeloads: false })} onUpdate={onUpdate} />);
    expect(screen.getByText(/18-week program without deload weeks/i)).toBeInTheDocument();
  });

  it('clamps programStartWeek when deloads toggled off (21 -> 18)', () => {
    const data = makeData({ programWithDeloads: true, programStartWeek: 21 });
    render(<RtfConfiguration data={data} onUpdate={onUpdate} />);

    // Toggle off deloads
    fireEvent.click(screen.getByLabelText(/Include deload weeks/i));

    // Should clamp to 18
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ programWithDeloads: false, programStartWeek: 18 })
    );
  });

  it('shows weekday consistency hint', () => {
    const data = makeData({ programStartDate: '2025-09-01' }); // Monday
    render(<RtfConfiguration data={data} onUpdate={onUpdate} />);
    
    // Should show the consistency hint component
    expect(screen.getByText(/Start date falls on your first training day/i)).toBeInTheDocument();
  });

  it('shows program preview section', () => {
    render(<RtfConfiguration data={makeData()} onUpdate={onUpdate} />);
    const previewSections = screen.getAllByText(/Program Preview/i);
    expect(previewSections.length).toBeGreaterThan(0);
  });
});
