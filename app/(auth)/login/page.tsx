'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

import { ClassicalLoader } from '@/components/ui/classical-loader'
import { sanitizeInternalRedirect } from '@/lib/utils/internal-redirect'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

import { LoginHeader } from './components/LoginHeader'
import { SupabaseLoginForm } from './components/SupabaseLoginForm'

// Force dynamic rendering to avoid SSG issues with useSearchParams
export const dynamic = 'force-dynamic'

function LoginContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { isAuthenticated, isLoading } = useSupabaseAuth()

	useEffect(() => {
		// Redirect authenticated users away from /login
		if (!isLoading && isAuthenticated) {
			const redirectTo = sanitizeInternalRedirect(
				searchParams.get('redirectTo'),
			)
			// Replace to avoid adding /login to history stack
			router.replace(redirectTo)
			// hard-navigation fallback in case client routing is blocked
			const t = setTimeout(() => {
				if (
					typeof window !== 'undefined' &&
					window.location.pathname === '/login'
				) {
					window.location.replace(redirectTo)
				}
			}, 300)
			return () => clearTimeout(t)
		}
	}, [isAuthenticated, isLoading, router, searchParams])

	// Show loading while checking auth state
	if (isLoading) {
		return (
			<div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
				<ClassicalLoader size="md" label="Checking authentication" />
				<p className="type-body-sm text-ink-3">Checking authentication...</p>
			</div>
		)
	}

	// When already authenticated, avoid rendering an extra loader to reduce flicker.
	// The effect above will immediately replace to the target route.
	if (isAuthenticated) return null

	// §9.2: no page-level entrance animation.
	return (
		<div>
			<LoginHeader />
			<SupabaseLoginForm />
		</div>
	)
}

export default function LoginPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<LoginContent />
		</Suspense>
	)
}
