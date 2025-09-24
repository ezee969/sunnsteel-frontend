'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { LoginHeader } from './components/LoginHeader';
import { SupabaseLoginForm } from './components/SupabaseLoginForm';
import { useSupabaseAuth } from '@/providers/supabase-auth-provider';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useSupabaseAuth();

  useEffect(() => {
    console.log('🔄 Login page auth state:', { isAuthenticated, isLoading })
    // Redirect authenticated users away from /login
    if (!isLoading && isAuthenticated) {
      // sanitize redirect target: same-origin path only
      const raw = searchParams.get('redirectTo') || '/dashboard'
      const redirectTo = raw.startsWith('/') ? raw : '/dashboard'
      // Replace to avoid adding /login to history stack
      router.replace(redirectTo)
      // hard-navigation fallback in case client routing is blocked
      const t = setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname === '/login') {
          window.location.replace(redirectTo)
        }
      }, 300)
      return () => clearTimeout(t)
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-[400px]"
      >
        <div className="text-center">
          <div className="rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto animate-spin" />
          <p className="mt-2 text-gray-600">Checking authentication...</p>
        </div>
      </motion.div>
    );
  }

  // If authenticated, show loading state while redirecting
  if (isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-[400px]"
      >
        <div className="text-center">
          <div className="rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto animate-spin" />
          <p className="mt-2 text-gray-600">Redirecting to dashboard...</p>
          <p className="mt-1 text-sm text-gray-500">
            If nothing happens, <a href="/dashboard" className="underline">click here</a>.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <LoginHeader />
      <SupabaseLoginForm />
    </motion.div>
  );
}
