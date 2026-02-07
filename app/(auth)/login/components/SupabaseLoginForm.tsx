'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
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
  const router = useRouter();
  const targetRedirect = searchParams.get('redirectTo') || '/dashboard';
  const message = searchParams.get('message');
  const [showPassword, setShowPassword] = useState(false);

  // Pre-warm the dashboard route to prevent ERR_FAILED during redirect
  // This triggers Next.js to compile the dashboard before login completes
  useEffect(() => {
    router.prefetch('/dashboard');
  }, [router]);

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
    <div className="w-full max-w-sm mx-auto">
      <TopLoadingBar show={isPending || isGooglePending} />

      {message === 'verify-email' && (
        <div className="p-3 sm:p-4 text-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-lg text-green-800 dark:text-green-200 mb-6 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium mb-1">Account created!</p>
            <p className="text-xs opacity-90">
              Check your email to verify your account.
            </p>
          </div>
        </div>
      )}

      {isError && (
        <div className="p-3 sm:p-4 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg text-red-800 dark:text-red-200 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium mb-1">Unable to sign in</p>
            <p className="text-xs opacity-90">
              {error?.message || 'Please check your credentials.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            aria-busy={isPending || isGooglePending}
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                        <Input
                        placeholder="name@example.com"
                        type="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                        className="pl-10 h-11 bg-neutral-100/50 dark:bg-neutral-900/50 border-neutral-200 dark:border-transparent focus:border-neutral-400 dark:focus:border-neutral-700 focus:ring-0 focus:bg-white dark:focus:bg-neutral-900 transition-all font-medium"
                        disabled={isPending || isGooglePending}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors p-2 -mr-2"
                      tabIndex={-1}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="pl-10 pr-10 h-11 bg-neutral-100/50 dark:bg-neutral-900/50 border-neutral-200 dark:border-transparent focus:border-neutral-400 dark:focus:border-neutral-700 focus:ring-0 focus:bg-white dark:focus:bg-neutral-900 transition-all font-medium"
                        disabled={isPending || isGooglePending}
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors p-1"
                        disabled={isPending || isGooglePending}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              className="w-full h-11 font-medium text-base bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
              type="submit"
              disabled={isPending || isGooglePending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Log in
                  <ChevronRight className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-neutral-200 dark:border-neutral-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest">
            <span className="px-4 text-neutral-400 dark:text-neutral-500">
              Or
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-11 border-neutral-200 dark:border-neutral-800 bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors text-neutral-600 dark:text-neutral-300 font-medium"
          onClick={handleGoogleSignIn}
          disabled={isPending || isGooglePending}
          type="button"
        >
          {isGooglePending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Image
              src="/icons/google-icon-logo-svgrepo-com.svg"
              alt="Google"
              width={16}
              height={16}
              className="mr-2 h-4 w-4 opacity-70 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all"
            />
          )}
          Continue with Google
        </Button>
      </div>

      <div className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-semibold text-neutral-900 dark:text-neutral-100 hover:underline underline-offset-4 pointer-cursor p-2"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
