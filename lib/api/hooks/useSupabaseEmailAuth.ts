import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseAuthService } from '../services/supabaseAuthService'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export interface EmailLoginInput {
  email: string
  password: string
}

export interface EmailSignupInput extends EmailLoginInput {
  name: string
}

/**
 * useSupabaseEmailAuth - Combined hook for login, signup, logout with loading states
 */
export function useSupabaseEmailAuth() {
  const qc = useQueryClient()
  const router = useRouter()
  const [signinError, setSigninError] = useState<Error | null>(null)
  
  const signinMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      setSigninError(null)
      return supabaseAuthService.signIn(email, password)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user'] })
      router.replace('/dashboard')
    },
    onError: (error: Error) => {
      setSigninError(error)
    },
  })

  const signupMutation = useMutation({
    mutationFn: async ({ email, password, name }: { email: string; password: string; name: string }) => {
      return supabaseAuthService.signUp(email, password, name)
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['user'] })
      // Redirect based on whether email verification is required
      if (data.requiresEmailVerification) {
        router.push('/login?message=verify-email')
      } else {
        router.push('/dashboard')
      }
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await supabaseAuthService.signOut()
    },
    onSuccess: () => {
      qc.clear()
      router.replace('/login')
    },
  })

  return {
    // Sign in
    signIn: (email: string, password: string) => signinMutation.mutateAsync({ email, password }),
    isSigningIn: signinMutation.isPending,
    signinError,
    // Sign up
    signUp: (email: string, password: string, name: string) => signupMutation.mutateAsync({ email, password, name }),
    isSigningUp: signupMutation.isPending,
    signupError: signupMutation.error,
    // Logout
    signOut: logoutMutation.mutateAsync,
    isSigningOut: logoutMutation.isPending,
  }
}

/**
 * useSupabaseEmailLogin
 * Performs email/password login through Supabase then verifies with backend.
 * On success, invalidates user queries so profile refetches.
 */
export function useSupabaseEmailLogin() {
  const qc = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: async ({ email, password }: EmailLoginInput) => {
      return supabaseAuthService.signIn(email, password)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user'] })
      router.replace('/dashboard')
    },
  })
}

/**
 * useSupabaseEmailSignup
 * Creates a Supabase account, verifies with backend, then redirects appropriately.
 */
export function useSupabaseEmailSignup() {
  const qc = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: async ({ email, password, name }: EmailSignupInput) => {
      return supabaseAuthService.signUp(email, password, name)
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['user'] })
      // Redirect based on whether email verification is required
      if (data.requiresEmailVerification) {
        router.push('/login?message=verify-email')
      } else {
        router.push('/dashboard')
      }
    },
  })
}

/**
 * useSupabaseLogout
 * Signs out of Supabase and clears query cache via provider subscription side effect.
 */
export function useSupabaseLogout() {
  const qc = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: async () => {
      await supabaseAuthService.signOut()
    },
    onSuccess: () => {
      qc.clear()
      router.replace('/login')
    },
  })
}
