'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LoginHeader } from './components/LoginHeader';
import { SupabaseLoginForm } from './components/SupabaseLoginForm';
import { useSupabaseAuth } from '@/providers/supabase-auth-provider';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useSupabaseAuth();

  useEffect(() => {
    console.log('🔄 Login page auth state:', { isAuthenticated, isLoading });

    // If user is authenticated, redirect to dashboard
    if (isAuthenticated && !isLoading) {
      console.log('🔄 User is authenticated, redirecting to dashboard...');
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

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
