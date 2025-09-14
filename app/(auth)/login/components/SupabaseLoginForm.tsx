'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
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
    signIn(values);
  }

  // Handle Google Sign-In
  function handleGoogleSignIn() {
    googleSignIn();
  }

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

        {/* Separator + Google Sign-In Button  */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-800/20 dark:bg-neutral-200/20" />
          <span className="text-xs text-neutral-700/70 dark:text-neutral-300/70">
            or
          </span>
          <div className="h-px flex-1 bg-neutral-800/20 dark:bg-neutral-200/20" />
        </div>

        <Button
          variant="outline"
          className="w-full bg-white/80 dark:bg-black/40 border border-amber-500/20 dark:border-amber-300/20 text-black dark:text-white hover:bg-white/90 dark:hover:bg-black/50 transition-colors duration-700"
          onClick={handleGoogleSignIn}
          disabled={isPending || isGooglePending}
          type="button"
        >
          {isGooglePending ? 'Redirecting...' : 'Continue with Google'}
        </Button>
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
