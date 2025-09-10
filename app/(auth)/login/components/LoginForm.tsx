'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useLogin } from '@/lib/api/hooks/useLogin';
import { useGoogleLogin } from '@/lib/api/hooks/useGoogleLogin';
import { useForm } from 'react-hook-form';
import { LoginFormValues, loginSchema } from '@/schema/login-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { tokenService } from '@/lib/api/services/tokenService';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TopLoadingBar } from '../../../../components/ui/top-loading-bar';
declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id?: string;
            callback: (resp: { credential?: string }) => void;
            auto_select?: boolean;
            itp_support?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, unknown>
          ) => void;
          prompt: (
            callback?: (notification: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
              isDismissedMoment: () => boolean;
              getMomentType: () => string;
            }) => void
          ) => void;
        };
      };
    };
  }
}

export function LoginForm() {
  const router = useRouter();
  const { mutate: login, isPending, isError, error } = useLogin();
  const { mutate: googleLogin, isPending: isGooglePending } = useGoogleLogin();
  const googleBtnRendered = useRef(false);
  const lastGoogleBtnWidth = useRef<number>(0);

  // Initialize form with react-hook-form and zod resolver
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Form submission handler
  function onSubmit(values: LoginFormValues) {
    login(values, {
      onSuccess: () => {
        router.push('/dashboard');
      },
    });
  }

  // Initialize Google Identity Services and render the Google Sign-In button
  useEffect(() => {
    // If already authenticated, skip initializing the Google button to avoid unnecessary iframe loads
    if (tokenService.getAccessToken()) return;

    const tryInit = () => {
      if (googleBtnRendered.current) return;
      const idApi = window.google?.accounts?.id;
      if (!idApi) return;

      try {
        idApi.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: (resp: { credential?: string }) => {
            const idToken = resp?.credential;
            if (!idToken) return;
            googleLogin(idToken, {
              onSuccess: () => router.push('/dashboard'),
            });
          },
          auto_select: true,
          itp_support: true,
          cancel_on_tap_outside: false,
        });

        const container = document.getElementById('googleSignInDiv');
        if (container) {
          const computeWidth = () => {
            const cw = container.clientWidth || 280;
            // Clamp Google button width to container: 200..360 and <= container width
            return Math.max(200, Math.min(360, Math.floor(cw)));
          };

          const render = (w: number) => {
            if (!container) return;
            // Clear existing before re-render to avoid duplicates
            while (container.firstChild) container.removeChild(container.firstChild);
            idApi.renderButton(container, {
              theme: 'outline',
              size: 'medium',
              shape: 'pill',
              width: w,
              text: 'signin_with',
            } as Record<string, unknown>);
          };

          const width = computeWidth();
          render(width);
          lastGoogleBtnWidth.current = width;
          googleBtnRendered.current = true;

          // Rerender on resize if the width changes significantly
          const onResize = () => {
            const next = computeWidth();
            if (Math.abs(next - lastGoogleBtnWidth.current) >= 24) {
              render(next);
              lastGoogleBtnWidth.current = next;
            }
          };
          window.addEventListener('resize', onResize);
          // Clean up
          const cleanup = () => window.removeEventListener('resize', onResize);
          // Store cleanup on the element so we can call it in effect cleanup
          (container as unknown as { __cleanup?: () => void }).__cleanup = cleanup;
        }

        // One Tap prompt (guarded)
        try {
          // Skip One Tap if already authenticated or recently dismissed
          const dismissed =
            typeof window !== 'undefined' &&
            !!window.sessionStorage?.getItem('oneTapDismissed');
          const shuttingDown =
            typeof window !== 'undefined' &&
            !!window.sessionStorage?.getItem('authShuttingDown');
          if (!tokenService.getAccessToken() && !dismissed && !shuttingDown) {
            idApi.prompt((notification) => {
              // If user dismisses, avoid re-prompting this session
              if (notification?.isDismissedMoment?.()) {
                try {
                  window.sessionStorage?.setItem('oneTapDismissed', '1');
                } catch {}
              }
            });
          }
        } catch {
          // Ignore One Tap prompt errors
        }
      } catch {
        // Fail silently; user can still log in with email/password
      }
    };

    // Try immediately (in case script is already loaded)
    tryInit();

    // Also listen for the script load signal to retry init
    const onReady = () => tryInit();
    window.addEventListener('google-identity-ready', onReady);

    // Poll for a short period in case the script loaded before this effect
    let attempts = 0;
    const maxAttempts = 30; // ~6s total at 200ms
    const intervalId = window.setInterval(() => {
      if (googleBtnRendered.current) {
        window.clearInterval(intervalId);
        return;
      }
      const idApi = window.google?.accounts?.id;
      if (idApi) {
        tryInit();
        window.clearInterval(intervalId);
        return;
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        window.clearInterval(intervalId);
      }
    }, 200);

    return () => {
      window.removeEventListener('google-identity-ready', onReady);
      window.clearInterval(intervalId);
      try {
        const container = document.getElementById('googleSignInDiv') as unknown as {
          __cleanup?: () => void;
        } | null;
        container?.__cleanup?.();
      } catch {}
    };
  }, [googleLogin, router]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative backdrop-blur-sm bg-white/70 dark:bg-black/40 rounded-2xl p-8 shadow-2xl border border-amber-500/20 dark:border-amber-300/20 transition-colors duration-700">
        <TopLoadingBar show={isPending || isGooglePending} />
        {isError && (
          <div className="p-3 text-sm bg-red-900/20 border border-red-500/30 rounded text-red-200 mb-6">
            {error?.message || 'Login failed. Please try again.'}
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            aria-busy={isPending || isGooglePending}
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-neutral-800/80 dark:text-neutral-200/80 transition-colors duration-700">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="name@example.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      className="bg-white/80 dark:bg-black/40 border border-amber-500/20 dark:border-amber-300/20 text-black dark:text-white placeholder:text-neutral-500/60 dark:placeholder:text-neutral-400/50 focus:border-amber-400/50 dark:focus:border-amber-400/50 focus-visible:ring-amber-400/30 transition-colors duration-700"
                      disabled={isPending || isGooglePending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 dark:text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-neutral-800/80 dark:text-neutral-200/80 transition-colors duration-700">
                    Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-white/80 dark:bg-black/40 border border-amber-500/20 dark:border-amber-300/20 text-black dark:text-white placeholder:text-neutral-500/60 dark:placeholder:text-neutral-400/50 focus:border-amber-400/50 dark:focus:border-amber-400/50 focus-visible:ring-amber-400/30 transition-colors duration-700"
                      disabled={isPending || isGooglePending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 dark:text-red-400" />
                </FormItem>
              )}
            />

            <Button
              className="w-full hover:scale-[1.02] transition-transform duration-300 font-semibold"
              variant="classical"
              type="submit"
              disabled={isPending || isGooglePending}
              aria-label={isPending || isGooglePending ? 'Signing you in' : 'Log in'}
            >
              {isPending || isGooglePending ? 'Signing you in...' : 'Log in'}
              {!isPending && !isGooglePending && (
                <ChevronRight className="w-4 h-4 ml-2" />
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* Separator + Google Sign-In Button  */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-800/20 dark:bg-neutral-200/20" />
        <span className="text-xs text-neutral-700/70 dark:text-neutral-300/70">or</span>
        <div className="h-px flex-1 bg-neutral-800/20 dark:bg-neutral-200/20" />
      </div>

      <div className="flex justify-center">
        <div className="relative w-full" aria-busy={isPending || isGooglePending}>
          {/* Click guard while loading */}
          {(isPending || isGooglePending) && (
            <div
              className="absolute inset-0 z-10 cursor-not-allowed"
              aria-hidden="true"
            />
          )}
          <div
            id="googleSignInDiv"
            aria-label="Sign in with Google"
            className="w-full flex justify-center"
          />
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-neutral-700/80 dark:text-neutral-300/80 transition-colors duration-700">
          Ready to begin your ascension?{' '}
          <Link
            href="/signup"
            className="text-[#FFD700] dark:text-[#B8860B] hover:text-red-300 dark:hover:text-red-700 transition-colors font-medium"
          >
            Join Now
          </Link>
        </p>
      </div>
    </div>
  );
}
