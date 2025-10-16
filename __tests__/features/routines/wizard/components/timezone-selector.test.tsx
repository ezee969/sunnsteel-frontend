import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimezoneSelector } from '@/features/routines/wizard/components/TimezoneSelector'

describe('TimezoneSelector', () => {
	it('renders with placeholder when no value selected', () => {
		const onChange = vi.fn()
		render(<TimezoneSelector onChange={onChange} placeholder="Select timezone..." />)
		
		expect(screen.getByRole('combobox')).toHaveTextContent('Select timezone...')
	})

	it('displays selected timezone with offset', () => {
		const onChange = vi.fn()
		render(
			<TimezoneSelector
				value="America/New_York"
				onChange={onChange}
				placeholder="Select timezone..."
			/>
		)
		
		const button = screen.getByRole('combobox')
		expect(button).toHaveTextContent('New York')
		expect(button).toHaveTextContent(/UTC[+-]\d+/)
	})

	it('opens dropdown when clicked', async () => {
		const onChange = vi.fn()
		const user = userEvent.setup()
		
		render(<TimezoneSelector onChange={onChange} />)
		
		const button = screen.getByRole('combobox')
		await user.click(button)
		
		await waitFor(() => {
			expect(screen.getByPlaceholderText('Search timezones...')).toBeInTheDocument()
		})
	})

	it('shows "Use system timezone" quick action', async () => {
		const onChange = vi.fn()
		const user = userEvent.setup()
		
		render(<TimezoneSelector onChange={onChange} />)
		
		const button = screen.getByRole('combobox')
		await user.click(button)
		
		await waitFor(() => {
			expect(screen.getByText(/Use system timezone/i)).toBeInTheDocument()
		})
	})

	it('calls onChange when timezone is selected', async () => {
		const onChange = vi.fn()
		const user = userEvent.setup()
		
		render(<TimezoneSelector onChange={onChange} />)
		
		const button = screen.getByRole('combobox')
		await user.click(button)
		
		await waitFor(() => {
			expect(screen.getByText('New York')).toBeInTheDocument()
		})
		
		await user.click(screen.getByText('New York'))
		
		expect(onChange).toHaveBeenCalledWith('America/New_York')
	})

	it('filters timezones based on search input', async () => {
		const onChange = vi.fn()
		const user = userEvent.setup()
		
		render(<TimezoneSelector onChange={onChange} />)
		
		const button = screen.getByRole('combobox')
		await user.click(button)
		
		const searchInput = await screen.findByPlaceholderText('Search timezones...')
		await user.type(searchInput, 'Tokyo')
		
		await waitFor(() => {
			expect(screen.getByText('Tokyo')).toBeInTheDocument()
			expect(screen.queryByText('New York')).not.toBeInTheDocument()
		})
	})

	it('groups timezones by region', async () => {
		const onChange = vi.fn()
		const user = userEvent.setup()
		
		render(<TimezoneSelector onChange={onChange} />)
		
		const button = screen.getByRole('combobox')
		await user.click(button)
		
		await waitFor(() => {
			expect(screen.getByText('Americas')).toBeInTheDocument()
			expect(screen.getByText('Europe')).toBeInTheDocument()
			expect(screen.getByText('Asia')).toBeInTheDocument()
			expect(screen.getByText('Pacific')).toBeInTheDocument()
		})
	})

	it('closes dropdown after selection', async () => {
		const onChange = vi.fn()
		const user = userEvent.setup()
		
		render(<TimezoneSelector onChange={onChange} />)
		
		const button = screen.getByRole('combobox')
		await user.click(button)
		
		await waitFor(() => {
			expect(screen.getByText('New York')).toBeInTheDocument()
		})
		
		await user.click(screen.getByText('New York'))
		
		await waitFor(() => {
			expect(screen.queryByPlaceholderText('Search timezones...')).not.toBeInTheDocument()
		})
	})

	it('uses system timezone when quick action is clicked', async () => {
		const onChange = vi.fn()
		const user = userEvent.setup()
		
		// Mock system timezone
		const mockTimezone = 'America/Los_Angeles'
		vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
			timeZone: mockTimezone,
		} as any)
		
		render(<TimezoneSelector onChange={onChange} />)
		
		const button = screen.getByRole('combobox')
		await user.click(button)
		
		const systemOption = await screen.findByText(/Use system timezone/i)
		await user.click(systemOption)
		
		expect(onChange).toHaveBeenCalledWith(mockTimezone)
	})

	it('displays unknown timezone with fallback formatting', () => {
		const onChange = vi.fn()
		const unknownTimezone = 'America/Argentina/Buenos_Aires'
		
		render(
			<TimezoneSelector
				value={unknownTimezone}
				onChange={onChange}
			/>
		)
		
		const button = screen.getByRole('combobox')
		// Should display extracted city name
		expect(button).toHaveTextContent('Buenos Aires')
		// Should display UTC offset
		expect(button).toHaveTextContent(/UTC[+-]?\d+/)
	})

	it('displays known timezone from curated list', () => {
		const onChange = vi.fn()
		
		render(
			<TimezoneSelector
				value="America/New_York"
				onChange={onChange}
			/>
		)
		
		const button = screen.getByRole('combobox')
		expect(button).toHaveTextContent('New York')
		expect(button).toHaveTextContent(/UTC[+-]?\d+/)
	})
})
