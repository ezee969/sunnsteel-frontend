'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

import { ClassicalLoader } from '@/components/ui/classical-loader'
import { sanitizeInternalRedirect } from '@/lib/utils/internal-redirect'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

// Force this page to be client-side only to avoid prerendering issues
export const dynamic = 'force-dynamic'

function AuthCallbackContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { session, user, error, isLoading } = useSupabaseAuth()

	useEffect(() => {
		if (isLoading) return
		if (error) {
			router.replace('/login?error=verify_failed')
			return
		}
		if (!session) {
			router.replace('/login?error=no_session')
			return
		}
		// The provider publishes this profile only after the marker is settled.
		// Do not start a second verification request from the callback page.
		if (user) {
			router.replace(sanitizeInternalRedirect(searchParams.get('callbackUrl')))
		}
	}, [error, isLoading, router, searchParams, session, user])

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="flex flex-col items-center space-y-4">
				<ClassicalLoader size="lg" label="Completing authentication" />
				<div className="text-center space-y-2">
					<p className="text-lg font-medium">Completing authentication...</p>
					<p className="text-sm text-muted-foreground">
						Please wait while we verify your credentials
					</p>
				</div>
			</div>
		</div>
	)
}

export default function AuthCallback() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					<div className="flex flex-col items-center space-y-4">
						<ClassicalLoader size="lg" label="Preparing authentication" />
						<div className="text-center space-y-2">
							<p className="text-lg font-medium">Loading...</p>
							<p className="text-sm text-muted-foreground">
								Preparing authentication...
							</p>
						</div>
					</div>
				</div>
			}
		>
			<AuthCallbackContent />
		</Suspense>
	)
}
