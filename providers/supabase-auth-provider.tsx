'use client'

import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react'

import type { AuthResponse } from '@/lib/api/services/supabaseAuthService'
import { supabaseAuthService } from '@/lib/api/services/supabaseAuthService'
import { createAuthSessionController } from '@/lib/auth/auth-session-controller'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

interface SupabaseAuthContextType {
	isAuthenticated: boolean
	isLoading: boolean
	session: Session | null
	user: AuthResponse['user'] | null
	error: Error | null
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
	isAuthenticated: false,
	isLoading: true,
	session: null,
	user: null,
	error: null,
})

export const SupabaseAuthProvider = ({ children }: { children: ReactNode }) => {
	const queryClient = useQueryClient()
	const [session, setSession] = useState<Session | null>(null)
	const [user, setUser] = useState<AuthResponse['user'] | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	useEffect(() => {
		const controller = createAuthSessionController({
			verifyToken: token => supabaseAuthService.verifyToken(token),
			invalidateVerification: () =>
				supabaseAuthService.invalidateVerification(),
			clearSessionMarker: () => supabaseAuthService.clearSessionMarker(),
			setSession,
			setUser,
			setError,
			setIsLoading,
			clearQueries: () => queryClient.clear(),
			invalidateUser: () => {
				void queryClient.invalidateQueries({ queryKey: ['user'] })
			},
		})
		// INITIAL_SESSION remains the sole source of startup session state.
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			logger.debug('[auth] state change', event, {
				hasSession: !!session,
				userId: session?.user?.id,
			})
			controller.handleAuthStateChange(event, session)
		})

		return () => {
			controller.dispose()
			subscription.unsubscribe()
		}
	}, [queryClient])

	const value = {
		// isAuthenticated requires both a Supabase session AND a verified backend user profile
		isAuthenticated: !!session && !!user,
		isLoading,
		session,
		user,
		error,
	}

	return (
		<SupabaseAuthContext.Provider value={value}>
			{children}
		</SupabaseAuthContext.Provider>
	)
}

export const useSupabaseAuth = () => {
	const context = useContext(SupabaseAuthContext)
	if (context === undefined) {
		throw new Error(
			'useSupabaseAuth must be used within a SupabaseAuthProvider',
		)
	}
	return context
}
