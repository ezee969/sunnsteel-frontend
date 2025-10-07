'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, Loader2, Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  useSupabaseSignIn,
  useSupabaseGoogleSignIn,
} from '@/lib/api/hooks/useSupabaseAuth';
import { useForm } from 'react-hook-form';
import { LoginFormValues, loginSchema } from '@/schema/login-schema';
import { zodResolver } from '@hookform/resolvers/zod';
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

export function SupabaseLoginForm() {
  const { mutate: signIn, isPending, isError, error } = useSupabaseSignIn();
  const { mutate: googleSignIn, isPending: isGooglePending } =
    useSupabaseGoogleSignIn();
  const searchParams = useSearchParams();
  const targetRedirect = searchParams.get('redirectTo') || '/dashboard';
  const message = searchParams.get('message');
  const [showPassword, setShowPassword] = useState(false);

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
    signIn({ ...values, redirectTo: targetRedirect });
  }

  // Handle Google Sign-In
  function handleGoogleSignIn() {
    googleSignIn(targetRedirect);
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="relative backdrop-blur-sm bg-white/70 dark:bg-black/40 rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl border border-amber-500/20 dark:border-amber-300/20 transition-colors duration-700">
        <TopLoadingBar show={isPending || isGooglePending} />

        {message === 'verify-email' && (
          <div className="p-3 sm:p-4 text-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-lg text-green-800 dark:text-green-200 mb-4 sm:mb-6 flex items-start gap-2 sm:gap-3">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium mb-1">Account created successfully!</p>
              <p className="text-xs opacity-90">
                Please check your email and click the verification link to activate your account. Then you can log in here.
              </p>
            </div>
          </div>
        )}

        {isError && (
          <div className="p-3 sm:p-4 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg text-red-800 dark:text-red-200 mb-4 sm:mb-6 flex items-start gap-2 sm:gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium mb-1">Unable to sign in</p>
              <p className="text-xs opacity-90">
                {error?.message || 'Please check your credentials and try again.'}
              </p>
            </div>
          </div>
        )}

        {/* Google Sign-In Button */}
        <Button
          variant="outline"
          className="w-full bg-white/80 dark:bg-black/40 border border-amber-500/20 dark:border-amber-300/20 text-black dark:text-white hover:bg-white/90 dark:hover:bg-black/50 transition-colors duration-700"
          onClick={handleGoogleSignIn}
          disabled={isPending || isGooglePending}
          type="button"
          aria-label={isGooglePending ? 'Signing in with Google' : 'Sign in with Google'}
        >
          {isGooglePending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Image
              src="/icons/google-icon-logo-svgrepo-com.svg"
              alt="Google"
              width={16}
              height={16}
              className="mr-2 h-4 w-4"
              priority={false}
            />
          )}
          Google
        </Button>

        {/* Separator */}
        <div className="my-4 sm:my-5 md:my-6 flex items-center gap-2 sm:gap-3">
          <div className="h-px flex-1 bg-neutral-800/20 dark:bg-neutral-200/20" />
          <span className="text-xs text-neutral-700/70 dark:text-neutral-300/70">or</span>
          <div className="h-px flex-1 bg-neutral-800/20 dark:bg-neutral-200/20" />
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 sm:space-y-5 md:space-y-6"
            aria-busy={isPending || isGooglePending}
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-neutral-800/80 dark:text-neutral-200/80 transition-colors duration-700 text-sm font-medium">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500/60 dark:text-neutral-400/50" />
                      <Input
                        placeholder="name@example.com"
                        type="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                        autoFocus
                        className="pl-10 bg-white/80 dark:bg-black/40 border border-amber-500/20 dark:border-amber-300/20 text-black dark:text-white placeholder:text-neutral-500/60 dark:placeholder:text-neutral-400/50 focus:border-amber-400/50 dark:focus:border-amber-400/50 focus-visible:ring-amber-400/30 transition-all duration-300 h-11"
                        disabled={isPending || isGooglePending}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-600 dark:text-red-400 text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-neutral-800/80 dark:text-neutral-200/80 transition-colors duration-700 text-sm font-medium">
                      Password
                    </FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                      tabIndex={-1}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500/60 dark:text-neutral-400/50" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="pl-10 pr-10 bg-white/80 dark:bg-black/40 border border-amber-500/20 dark:border-amber-300/20 text-black dark:text-white placeholder:text-neutral-500/60 dark:placeholder:text-neutral-400/50 focus:border-amber-400/50 dark:focus:border-amber-400/50 focus-visible:ring-amber-400/30 transition-all duration-300 h-11"
                        disabled={isPending || isGooglePending}
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500/60 dark:text-neutral-400/50 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                        disabled={isPending || isGooglePending}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-600 dark:text-red-400 text-xs" />
                </FormItem>
              )}
            />

            <Button
              className="w-full hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-semibold h-11 text-base mt-2"
              variant="classical"
              type="submit"
              disabled={isPending || isGooglePending}
              aria-label={isPending || isGooglePending ? 'Signing you in' : 'Log in'}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing you in...
                </>
              ) : (
                <>
                  Log in
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </Form>

        
      </div>

      <div className="mt-6 sm:mt-8 text-center">
        <p className="text-sm text-neutral-700/80 dark:text-neutral-300/80 transition-colors duration-700">
          Ready to begin your ascension?{' '}
          <Link
            href="/signup"
            className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors font-semibold underline-offset-4 hover:underline"
          >
            Join Now
          </Link>
        </p>
      </div>
    </div>
  );
}
