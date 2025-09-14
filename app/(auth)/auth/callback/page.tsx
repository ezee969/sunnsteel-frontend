'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/providers/supabase-auth-provider';

// Force this page to be client-side only to avoid prerendering issues
export const dynamic = 'force-dynamic';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, error } = useSupabaseAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Auth callback: Processing OAuth callback...');

        // Handle the OAuth callback - this will trigger the auth state change
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('🔄 Auth callback error:', error);
          router.push('/login?error=callback_error');
          return;
        }

        console.log('🔄 Auth callback: Session retrieved:', {
          hasSession: !!data.session,
          userId: data.session?.user?.id,
        });

        // Let the auth provider handle the session verification
        // We'll wait for it to update the auth state
        setIsProcessing(false);
      } catch (error) {
        console.error('🔄 Auth callback error:', error);
        router.push('/login?error=callback_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  // Once auth provider has processed the session, redirect accordingly
  useEffect(() => {
    if (!isProcessing && !isLoading) {
      if (isAuthenticated) {
        console.log(
          '🔄 Auth callback: User authenticated, redirecting to dashboard'
        );
        const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
        router.push(callbackUrl);
      } else if (error) {
        console.log('🔄 Auth callback: Authentication error, redirecting to login');
        router.push('/login?error=auth_failed');
      } else {
        console.log('🔄 Auth callback: No session, redirecting to login');
        router.push('/login');
      }
    }
  }, [isProcessing, isLoading, isAuthenticated, error, router, searchParams]);

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
  );
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
  );
}
