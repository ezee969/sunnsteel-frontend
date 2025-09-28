'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { supabaseAuthService } from '@/lib/api/services/supabaseAuthService';

// Force this page to be client-side only to avoid prerendering issues
export const dynamic = 'force-dynamic';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const sanitizePath = (p: string) => (p?.startsWith('/') ? p : '/dashboard');

    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Auth callback: Processing OAuth callback...');

        // Retrieve Supabase session created by OAuth provider
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('🔄 Auth callback error (getSession):', error);
          router.replace('/login?error=callback_error');
          return;
        }

        if (!data.session) {
          console.warn('🔄 Auth callback: No session found, redirecting to login');
          router.replace('/login?error=no_session');
          return;
        }

        console.log('🔄 Auth callback: Session retrieved:', {
          hasSession: !!data.session,
          userId: data.session?.user?.id,
        });

        // Verify with backend immediately to set secure HttpOnly cookie (ss_session)
        try {
          await supabaseAuthService.verifyToken(data.session.access_token);
          // Best-effort client marker for middleware fallback
          try {
            if (typeof document !== 'undefined') {
              document.cookie = [
                'has_session=1',
                'Path=/',
                'Max-Age=604800', // 7 days
                'SameSite=Lax',
              ].join('; ');
            }
          } catch {}
        } catch (verifyErr) {
          console.error('🔄 Auth callback: Backend verification failed:', verifyErr);
          router.replace('/login?error=verify_failed');
          return;
        }

        // Redirect to intended destination (or dashboard) without adding to history
        const raw = searchParams.get('callbackUrl') || '/dashboard';
        const target = sanitizePath(raw);
        router.replace(target);
      } catch (err) {
        console.error('🔄 Auth callback unexpected error:', err);
        router.replace('/login?error=callback_error');
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

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
