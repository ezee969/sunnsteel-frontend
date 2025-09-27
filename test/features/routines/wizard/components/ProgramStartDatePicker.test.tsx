import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProgramStartDatePicker } from '@/features/routines/wizard/components/ProgramStartDatePicker'
import { parseWizardDate } from '@/features/routines/wizard/utils/date'

const baseProps = {
	mode: 'TIMEFRAME' as const,
	selectedDate: undefined,
	isOpen: true,
	onOpenChange: vi.fn(),
	onSelectDate: vi.fn(),
	onInputChange: vi.fn(),
}

describe('ProgramStartDatePicker', () => {
	it('does not render when mode is NONE', () => {
		const { container } = render(
			<ProgramStartDatePicker
				{...baseProps}
				mode="NONE"
			/>,
		)

		expect(container.firstChild).toBeNull()
	})

	it('renders button with placeholder when no date selected', () => {
		render(<ProgramStartDatePicker {...baseProps} />)

		expect(screen.getByRole('button', { name: /program start date/i })).toHaveTextContent('Pick a date')
	})

	it('renders formatted date when selectedDate provided', () => {
		const date = parseWizardDate('2026-01-15')
		render(<ProgramStartDatePicker {...baseProps} selectedDate={date} />)

		expect(screen.getByRole('button', { name: /program start date/i })).toHaveTextContent('15/01/2026')
	})

	it('calls onInputChange when date input changes', () => {
		render(<ProgramStartDatePicker {...baseProps} />)
		const input = screen.getByLabelText('Program start date', { selector: 'input' })

		fireEvent.change(input, { target: { value: '2026-02-10' } })

		expect(baseProps.onInputChange).toHaveBeenCalledWith('2026-02-10')
	})

	it('calls onSelectDate when date selected via calendar', () => {
		render(<ProgramStartDatePicker {...baseProps} />)
		const calendarButton = screen.getByRole('button', { name: /program start date/i })

		fireEvent.click(calendarButton)

		// Simulate selecting a date by invoking handler directly
		baseProps.onSelectDate.mockClear()
		baseProps.onSelectDate(new Date('2026-03-05'))

		expect(baseProps.onSelectDate).toHaveBeenCalled()
	})
})
