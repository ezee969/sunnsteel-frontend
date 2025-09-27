import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import { RoutineProgress } from '@/features/routines/components/RoutineProgress'

describe('RoutineProgress', () => {
  it('renders default label and 0% when not completed', () => {
    render(<RoutineProgress completed={false} />)
    expect(screen.getByText('Completion')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('renders 100% when completed', () => {
    render(<RoutineProgress completed />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('respects custom label', () => {
    render(<RoutineProgress completed={false} label="Progress" />)
    expect(screen.getByText('Progress')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })
})
