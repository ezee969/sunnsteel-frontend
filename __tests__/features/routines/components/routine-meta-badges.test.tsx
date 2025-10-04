import { describe, it, expect } from 'vitest'
import { render, screen } from '@/__tests__/utils'
import { RoutineMetaBadges } from '@/features/routines/components/RoutineMetaBadges'

describe('RoutineMetaBadges', () => {
  it('renders days per week badge', () => {
    render(<RoutineMetaBadges daysPerWeek={4} />)
    expect(screen.getByText('4 days/week')).toBeInTheDocument()
  })

  it('renders Periodized badge when isPeriodized is true', () => {
    render(<RoutineMetaBadges daysPerWeek={3} isPeriodized />)
    expect(screen.getByText('Periodized')).toBeInTheDocument()
  })

  it('does not render Periodized badge when isPeriodized is false', () => {
    render(<RoutineMetaBadges daysPerWeek={3} isPeriodized={false} />)
    expect(screen.getByText('3 days/week')).toBeInTheDocument()
    expect(screen.queryByText('Periodized')).toBeNull()
  })
})
