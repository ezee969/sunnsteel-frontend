'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useRegister } from '@/lib/api/hooks/useRegister';
import { useForm } from 'react-hook-form';
import { SignupFormValues, signupSchema } from '@/schema/signup-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { mutate: register, isPending, isError, error } = useRegister();

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
  function onSubmit(values: SignupFormValues) {
    // Remove confirmPassword before sending to API
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...userData } = values;

    register(userData, {
      onSuccess: () => {
        router.push('/login');
      },
    });
  }

  return (
    <div className="w-full max-w-md">
      <div className="backdrop-blur-sm bg-black/30 dark:bg-white/30 rounded-2xl p-8 shadow-2xl border border-red-900/20 dark:border-red-200/20 transition-colors duration-700">
        {isError && (
          <div className="p-3 text-sm bg-red-900/20 border border-red-500/30 rounded text-red-200 mb-6">
            {error?.message || 'Registration failed. Please try again.'}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-red-200/70 dark:text-red-800/70 transition-colors duration-700">
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      type="text"
                      autoCapitalize="words"
                      autoComplete="name"
                      autoCorrect="off"
                      className="bg-black/30 dark:bg-white/30 border-red-900/20 dark:border-red-200/20 text-white dark:text-black placeholder:text-red-200/30 dark:placeholder:text-red-800/30 focus:border-red-500/50 dark:focus:border-red-500/50 transition-colors duration-700"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-red-200/70 dark:text-red-800/70 transition-colors duration-700">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="name@example.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      className="bg-black/30 dark:bg-white/30 border-red-900/20 dark:border-red-200/20 text-white dark:text-black placeholder:text-red-200/30 dark:placeholder:text-red-800/30 focus:border-red-500/50 dark:focus:border-red-500/50 transition-colors duration-700"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-red-200/70 dark:text-red-800/70 transition-colors duration-700">
                    Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-black/30 dark:bg-white/30 border-red-900/20 dark:border-red-200/20 text-white dark:text-black placeholder:text-red-200/30 dark:placeholder:text-red-800/30 focus:border-red-500/50 dark:focus:border-red-500/50 transition-colors duration-700"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-red-200/70 dark:text-red-800/70 transition-colors duration-700">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-black/30 dark:bg-white/30 border-red-900/20 dark:border-red-200/20 text-white dark:text-black placeholder:text-red-200/30 dark:placeholder:text-red-800/30 focus:border-red-500/50 dark:focus:border-red-500/50 transition-colors duration-700"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <Button
              className="w-full bg-gradient-to-r from-[#8B0000] to-[#B8860B] text-white dark:text-black hover:opacity-90 transition-all duration-300 transform hover:scale-[1.02] font-semibold"
              type="submit"
              disabled={isPending}
            >
              {isPending ? 'Creating account...' : 'Begin Your Journey'}
              {!isPending && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>
        </Form>
      </div>

      <div className="mt-8 text-center">
        <p className="text-red-200/70 dark:text-red-800/70 transition-colors duration-700">
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
