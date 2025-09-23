'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useSupabaseEmailAuth } from '@/lib/api/hooks';
import { useForm } from 'react-hook-form';
import { SignupFormValues, signupSchema } from '@/schema/signup-schema';
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

export function SignupForm() {
  const { signUp, isSigningUp, signupError } = useSupabaseEmailAuth();

  // Initialize form with react-hook-form and zod resolver
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Form submission handler
  async function onSubmit(values: SignupFormValues) {
    // Remove confirmPassword before sending to API
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...userData } = values

    try {
      await signUp(userData.email, userData.password, userData.name)
    } catch (error) {
      console.error('Signup failed:', error)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="backdrop-blur-sm bg-white/70 dark:bg-black/40 rounded-2xl p-8 shadow-2xl border border-amber-500/20 dark:border-amber-300/20 transition-colors duration-700">
        {signupError && (
          <div className="p-3 text-sm bg-red-900/20 border border-red-500/30 rounded text-red-200 mb-6">
            {signupError?.message || 'Registration failed. Please try again.'}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-neutral-800/80 dark:text-neutral-200/80 transition-colors duration-700">
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      type="text"
                      autoCapitalize="words"
                      autoComplete="name"
                      autoCorrect="off"
                      className="bg-white/80 dark:bg-black/40 border border-amber-500/20 dark:border-amber-300/20 text-black dark:text-white placeholder:text-neutral-500/60 dark:placeholder:text-neutral-400/50 focus:border-amber-400/50 dark:focus:border-amber-400/50 focus-visible:ring-amber-400/30 transition-colors duration-700"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 dark:text-red-400" />
                </FormItem>
              )}
            />

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
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 dark:text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-neutral-800/80 dark:text-neutral-200/80 transition-colors duration-700">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-white/80 dark:bg-black/40 border border-amber-500/20 dark:border-amber-300/20 text-black dark:text-white placeholder:text-neutral-500/60 dark:placeholder:text-neutral-400/50 focus:border-amber-400/50 dark:focus:border-amber-400/50 focus-visible:ring-amber-400/30 transition-colors duration-700"
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
              disabled={isSigningUp}
              aria-label={isSigningUp ? 'Creating account' : 'Begin your journey'}
            >
              {isSigningUp ? 'Creating account...' : 'Begin Your Journey'}
              {!isSigningUp && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>
        </Form>
      </div>

      <div className="mt-8 text-center">
        <p className="text-neutral-700/80 dark:text-neutral-300/80 transition-colors duration-700">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[#FFD700] dark:text-[#B8860B] hover:text-red-300 dark:hover:text-red-700 transition-colors font-medium"
          >
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
