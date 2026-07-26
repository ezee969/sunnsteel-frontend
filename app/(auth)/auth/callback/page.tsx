'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

import { supabaseAuthService } from '@/lib/api/services/supabaseAuthService'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

// Force this page to be client-side only to avoid prerendering issues
export const dynamic = 'force-dynamic'

function AuthCallbackContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [, setIsProcessing] = useState(true)

	useEffect(() => {
		const sanitizePath = (p: string) => (p?.startsWith('/') ? p : '/dashboard')

		const handleAuthCallback = async () => {
			try {
				const { data, error } = await supabase.auth.getSession()

				if (error) {
					logger.error('[auth-callback] getSession failed', error)
					router.replace('/login?error=callback_error')
					return
				}

				if (!data.session) {
					logger.warn('[auth-callback] missing session')
					router.replace('/login?error=no_session')
					return
				}

				try {
					// Verify with backend immediately to set secure HttpOnly cookie (ss_session)
					await supabaseAuthService.verifyToken(data.session.access_token)
				} catch (verifyErr) {
					logger.error('[auth-callback] backend verification failed', verifyErr)
					router.replace('/login?error=verify_failed')
					return
				}

				// Redirect to intended destination (or dashboard) without adding to history
				const raw = searchParams.get('callbackUrl') || '/dashboard'
				const target = sanitizePath(raw)
				router.replace(target)
			} catch (err) {
				logger.error('[auth-callback] unexpected error', err)
				router.replace('/login?error=callback_error')
			} finally {
				setIsProcessing(false)
			}
		}

		void handleAuthCallback()
	}, [router, searchParams])

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="flex flex-col items-center space-y-4">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
