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
    <div className="w-full max-w-sm mx-auto">
      <TopLoadingBar show={isPending || isGooglePending} />

      {isSuccess && (
        <div className="p-3 mb-6 text-sm text-green-800 dark:text-green-200 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Account created!</p>
            <p className="text-xs opacity-90">
              Check your email to verify your account.
            </p>
          </div>
        </div>
      )}

      {isError && (
        <div className="p-3 mb-6 text-sm text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Sign up failed</p>
            <p className="text-xs opacity-90">
              {error?.message || 'An error occurred during signup'}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                      <Input
                        placeholder="John Doe"
                        type="text"
                        autoCapitalize="words"
                        autoComplete="name"
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-11 bg-neutral-100/50 dark:bg-neutral-900/50 border-neutral-200 dark:border-transparent focus:border-neutral-400 dark:focus:border-neutral-700 focus:ring-0 focus:bg-white dark:focus:bg-neutral-900 transition-all font-medium"
                        disabled={isPending || isGooglePending}
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors p-1"
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
                  
                  {/* Password Strength Indicator */}
                  <div className="h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mt-2">
                    <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                  {field.value && (
                      <p className="text-xs text-neutral-500 mt-1">
                          Strength: <span className="font-medium">{passwordStrength.label}</span>
                      </p>
                  )}
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-11 bg-neutral-100/50 dark:bg-neutral-900/50 border-neutral-200 dark:border-transparent focus:border-neutral-400 dark:focus:border-neutral-700 focus:ring-0 focus:bg-white dark:focus:bg-neutral-900 transition-all font-medium"
                        disabled={isPending || isGooglePending}
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors p-1"
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
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
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
              className="mr-2 h-4 w-4 opacity-70 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all"
            />
          )}
          Continue with Google
        </Button>
      </div>

      <div className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-neutral-900 dark:text-neutral-100 hover:underline underline-offset-4 pointer-cursor p-2"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
