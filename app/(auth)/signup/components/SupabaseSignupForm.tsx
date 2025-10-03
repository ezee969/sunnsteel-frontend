'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Loader2, Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import {
	useSupabaseSignUp,
	useSupabaseGoogleSignIn,
} from '@/lib/api/hooks/useSupabaseAuth';
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
import { TopLoadingBar } from '../../../../components/ui/top-loading-bar';

// Password strength calculator
function calculatePasswordStrength(password: string): {
	strength: number;
	label: string;
	color: string;
} {
	if (!password) return { strength: 0, label: '', color: '' };

	let strength = 0;
	
	// Length check
	if (password.length >= 8) strength += 20;
	if (password.length >= 12) strength += 10;
	
	// Character diversity
	if (/[a-z]/.test(password)) strength += 15;
	if (/[A-Z]/.test(password)) strength += 15;
	if (/[0-9]/.test(password)) strength += 15;
	if (/[^a-zA-Z0-9]/.test(password)) strength += 25;

	let label = 'Weak';
	let color = 'bg-red-500';

	if (strength >= 80) {
		label = 'Strong';
		color = 'bg-green-500';
	} else if (strength >= 60) {
		label = 'Good';
		color = 'bg-amber-500';
	} else if (strength >= 40) {
		label = 'Fair';
		color = 'bg-yellow-500';
	}

	return { strength, label, color };
}

export function SupabaseSignupForm() {
	const { mutate: signUp, isPending, isError, error, isSuccess } = useSupabaseSignUp();
	const { mutate: googleSignUp, isPending: isGooglePending } =
		useSupabaseGoogleSignIn();
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    signUp(userData);
  }

  // Handle Google Sign-Up
  function handleGoogleSignUp() {
    googleSignUp('/dashboard');
  }

  // Calculate password strength
  const passwordStrength = calculatePasswordStrength(
    form.watch('password') || ''
  );

  return (
    <div className="w-full max-w-md">
      <div className="backdrop-blur-sm bg-white/70 dark:bg-black/40 rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl border border-amber-500/20 dark:border-amber-300/20 transition-colors duration-700">
        <TopLoadingBar show={isPending || isGooglePending} />

        {isSuccess && (
          <div className="flex items-center gap-2 p-3 mb-6 text-sm text-green-800 dark:text-green-200 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-lg">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Account created successfully!</p>
              <p className="text-xs mt-0.5">
                Please check your email to verify your account.
              </p>
            </div>
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 p-3 mb-6 text-sm text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Sign up failed</p>
              <p className="text-xs mt-0.5">
                {error?.message || 'An error occurred during signup'}
              </p>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full mb-6 bg-white/80 dark:bg-black/40 border-2 border-amber-500/20 dark:border-amber-300/20 text-black dark:text-white hover:bg-white/90 dark:hover:bg-black/50 transition-colors duration-700"
          onClick={handleGoogleSignUp}
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
              className="mr-2 h-4 w-4"
              priority={false}
            />
          )}
          Continue with Google
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-neutral-800/20 dark:border-neutral-200/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white/70 dark:bg-black/40 px-2 text-neutral-700/70 dark:text-neutral-300/70">
              Or continue with email
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5 md:space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-neutral-800/80 dark:text-neutral-200/80 transition-colors duration-700">
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500/60 dark:text-neutral-400/50" />
                      <Input
                        placeholder="John Doe"
                        type="text"
                        autoCapitalize="words"
                        autoComplete="name"
                        autoCorrect="off"
                        autoFocus
                        className="bg-white/80 dark:bg-black/40 border border-amber-500/20 dark:border-amber-300/20 text-black dark:text-white placeholder:text-neutral-500/60 dark:placeholder:text-neutral-400/50 focus:border-amber-400/50 dark:focus:border-amber-400/50 focus-visible:ring-amber-400/30 transition-colors duration-700 pl-10"
                        disabled={isPending || isGooglePending}
                        {...field}
                      />
                    </div>
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
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500/60 dark:text-neutral-400/50" />
                      <Input
                        placeholder="name@example.com"
                        type="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                        className="bg-white/80 dark:bg-black/40 border border-amber-500/20 dark:border-amber-300/20 text-black dark:text-white placeholder:text-neutral-500/60 dark:placeholder:text-neutral-400/50 focus:border-amber-400/50 dark:focus:border-amber-400/50 focus-visible:ring-amber-400/30 transition-colors duration-700 pl-10"
                        disabled={isPending || isGooglePending}
                        {...field}
                      />
                    </div>
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
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500/60 dark:text-neutral-400/50" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="bg-white/80 dark:bg-black/40 border border-amber-500/20 dark:border-amber-300/20 text-black dark:text-white placeholder:text-neutral-500/60 dark:placeholder:text-neutral-400/50 focus:border-amber-400/50 dark:focus:border-amber-400/50 focus-visible:ring-amber-400/30 transition-colors duration-700 pl-10 pr-10"
                        disabled={isPending || isGooglePending}
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500/60 dark:text-neutral-400/50 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
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
                  {field.value && passwordStrength.strength > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          Password strength:
                        </span>
                        <span className={`font-medium ${passwordStrength.strength >= 80 ? 'text-green-600 dark:text-green-400' : passwordStrength.strength >= 60 ? 'text-amber-600 dark:text-amber-400' : passwordStrength.strength >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${passwordStrength.strength}%` }}
                        />
                      </div>
                    </div>
                  )}
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
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500/60 dark:text-neutral-400/50" />
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="bg-white/80 dark:bg-black/40 border border-amber-500/20 dark:border-amber-300/20 text-black dark:text-white placeholder:text-neutral-500/60 dark:placeholder:text-neutral-400/50 focus:border-amber-400/50 dark:focus:border-amber-400/50 focus-visible:ring-amber-400/30 transition-colors duration-700 pl-10 pr-10"
                        disabled={isPending || isGooglePending}
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500/60 dark:text-neutral-400/50 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
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
              aria-label={
                isPending || isGooglePending
                  ? 'Creating account'
                  : 'Begin your journey'
              }
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Begin Your Journey
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>

      <div className="mt-4 sm:mt-6 md:mt-8 text-center">
        <p className="text-sm sm:text-base text-neutral-700/80 dark:text-neutral-300/80 transition-colors duration-700">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors font-medium underline-offset-4 hover:underline"
          >
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
