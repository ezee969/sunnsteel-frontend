/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import LoginPage from '@/app/(auth)/login/page'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
	useRouter: vi.fn(),
	useSearchParams: vi.fn()
}))

// Mock auth provider
vi.mock('@/providers/supabase-auth-provider', () => ({
	useSupabaseAuth: vi.fn()
}))

// Mock components
vi.mock('@/app/(auth)/login/components/LoginHeader', () => ({
	LoginHeader: () => <div data-testid="login-header">Login Header</div>
}))

vi.mock('@/app/(auth)/login/components/SupabaseLoginForm', () => ({
	SupabaseLoginForm: () => <div data-testid="login-form">Login Form</div>
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
	motion: {
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>
	}
}))

describe('LoginPage', () => {
	const mockReplace = vi.fn()
	const mockSearchParams = {
		get: vi.fn()
	}

	beforeEach(() => {
		vi.clearAllMocks()
		;(useRouter as any).mockReturnValue({
			replace: mockReplace
		})
		;(useSearchParams as any).mockReturnValue(mockSearchParams)
	})

	it('shows loading state when auth is loading', () => {
		;(useSupabaseAuth as any).mockReturnValue({
			isAuthenticated: false,
			isLoading: true
		})

		render(<LoginPage />)

		expect(screen.getByText('Checking authentication...')).toBeDefined()
	})

	it('shows login form when not authenticated', () => {
		;(useSupabaseAuth as any).mockReturnValue({
			isAuthenticated: false,
			isLoading: false
		})

		render(<LoginPage />)

		expect(screen.getByTestId('login-header')).toBeDefined()
		expect(screen.getByTestId('login-form')).toBeDefined()
	})

	it('redirects to dashboard when authenticated with no redirectTo param', () => {
		;(useSupabaseAuth as any).mockReturnValue({
			isAuthenticated: true,
			isLoading: false
		})
		mockSearchParams.get.mockReturnValue(null)

		const { container } = render(<LoginPage />)

		expect(mockReplace).toHaveBeenCalledWith('/dashboard')
		// When authenticated, component returns null (no content rendered)
		expect(container.firstChild).toBeNull()
	})

	it('redirects to specified path when authenticated with redirectTo param', () => {
		;(useSupabaseAuth as any).mockReturnValue({
			isAuthenticated: true,
			isLoading: false
		})
		mockSearchParams.get.mockReturnValue('/workouts')

		const { container } = render(<LoginPage />)

		expect(mockReplace).toHaveBeenCalledWith('/workouts')
		// When authenticated, component returns null (no content rendered)
		expect(container.firstChild).toBeNull()
	})

	it('sanitizes redirectTo param to prevent external redirects', () => {
		;(useSupabaseAuth as any).mockReturnValue({
			isAuthenticated: true,
			isLoading: false
		})
		mockSearchParams.get.mockReturnValue('https://evil.com/steal-data')

		const { container } = render(<LoginPage />)

		expect(mockReplace).toHaveBeenCalledWith('/dashboard')
		// When authenticated, component returns null (no content rendered)
		expect(container.firstChild).toBeNull()
	})
})