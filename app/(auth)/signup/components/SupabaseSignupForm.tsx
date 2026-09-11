'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
	AlertCircle,
	CheckCircle2,
	ChevronRight,
	Eye,
	EyeOff,
	Loader2,
	Lock,
	Mail,
	User,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
	useSupabaseGoogleSignIn,
	useSupabaseSignUp,
} from '@/lib/api/hooks/useSupabaseAuth'
import { SignupFormValues, signupSchema } from '@/schema/signup-schema'

import { TopLoadingBar } from '../../../../components/ui/top-loading-bar'

// Password strength calculator
function calculatePasswordStrength(password: string): {
	strength: number
	label: string
	color: string
} {
	if (!password) return { strength: 0, label: '', color: '' }

	let strength = 0

	// Length check
	if (password.length >= 8) strength += 20
	if (password.length >= 12) strength += 10

	// Character diversity
	if (/[a-z]/.test(password)) strength += 15
	if (/[A-Z]/.test(password)) strength += 15
	if (/[0-9]/.test(password)) strength += 15
	if (/[^a-zA-Z0-9]/.test(password)) strength += 25

	let label = 'Weak'
	let color = 'bg-destructive'

	if (strength >= 80) {
		label = 'Strong'
		color = 'bg-success-strong'
	} else if (strength >= 60) {
		label = 'Good'
		color = 'bg-ink-2'
	} else if (strength >= 40) {
		label = 'Fair'
		color = 'bg-warning-strong'
	}

	return { strength, label, color }
}

export function SupabaseSignupForm() {
	const {
		mutate: signUp,
		isPending,
		isError,
		error,
		isSuccess,
	} = useSupabaseSignUp()
	const { mutate: googleSignUp, isPending: isGooglePending } =
		useSupabaseGoogleSignIn()
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)

	// Initialize form with react-hook-form and zod resolver
	const form = useForm<SignupFormValues>({
		resolver: zodResolver(signupSchema),
		defaultValues: {
			name: '',
			email: '',
			password: '',
			confirmPassword: '',
		},
	})

	// Form submission handler
	function onSubmit(values: SignupFormValues) {
		// Remove confirmPassword before sending to API
		const { confirmPassword: _confirmPassword, ...userData } = values
		void _confirmPassword

		signUp(userData)
	}

	// Handle Google Sign-Up
	function handleGoogleSignUp() {
		googleSignUp('/dashboard')
	}

	// Calculate password strength
	const passwordStrength = calculatePasswordStrength(
		form.watch('password') || '',
	)

	return (
		<div className="w-full rounded-sm border border-rule bg-surface p-5 sm:p-6">
			<TopLoadingBar show={isPending || isGooglePending} />

			{isSuccess && (
				<div className="type-body-sm mark mark-success mb-6 flex items-center gap-3 bg-surface-sunk p-3 text-foreground">
					<CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden />
					<div className="flex-1">
						<p className="type-panel">Account created!</p>
						<p className="text-ink-2">
							Check your email to verify your account.
						</p>
					</div>
				</div>
			)}

			{isError && (
				<div
					role="alert"
					className="type-body-sm mark mb-6 flex items-center gap-3 border-l-destructive bg-surface-sunk p-3 text-foreground"
				>
					<AlertCircle
						className="h-5 w-5 shrink-0 text-destructive"
						aria-hidden
					/>
					<div className="flex-1">
						<p className="type-panel">Sign up failed</p>
						<p className="text-ink-2">
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
											<User
												className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-ink-3"
												aria-hidden
											/>
											<Input
												placeholder="John Doe"
												type="text"
												autoCapitalize="words"
												autoComplete="name"
												autoCorrect="off"
												className="pl-10"
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
											<Mail
												className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-ink-3"
												aria-hidden
											/>
											<Input
												placeholder="name@example.com"
												type="email"
												autoCapitalize="none"
												autoComplete="email"
												autoCorrect="off"
												className="pl-10"
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
											<Lock
												className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-ink-3"
												aria-hidden
											/>
											<Input
												type={showPassword ? 'text' : 'password'}
												placeholder="••••••••"
												className="pl-10 pr-11"
												disabled={isPending || isGooglePending}
												{...field}
											/>
											<button
												type="button"
												onClick={() => setShowPassword(!showPassword)}
												aria-label={
													showPassword ? 'Hide password' : 'Show password'
												}
												className="absolute right-0 top-0 flex h-full w-11 items-center justify-center text-ink-3 transition-colors duration-[var(--motion-fast)] ease-standard hover:text-foreground"
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
									<div className="mt-2 h-1 overflow-hidden rounded-none bg-rule-faint">
										<div
											className={`h-full origin-left transition-transform duration-[var(--motion-slow)] ease-standard ${passwordStrength.color}`}
											style={{ width: `${passwordStrength.strength}%` }}
										/>
									</div>
									{field.value && (
										<p className="type-body-sm mt-1 text-ink-3">
											Strength:{' '}
											<span className="font-medium">
												{passwordStrength.label}
											</span>
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
											<Lock
												className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-ink-3"
												aria-hidden
											/>
											<Input
												type={showConfirmPassword ? 'text' : 'password'}
												placeholder="••••••••"
												className="pl-10 pr-11"
												disabled={isPending || isGooglePending}
												{...field}
											/>
											<button
												type="button"
												onClick={() =>
													setShowConfirmPassword(!showConfirmPassword)
												}
												aria-label={
													showConfirmPassword
														? 'Hide password'
														: 'Show password'
												}
												className="absolute right-0 top-0 flex h-full w-11 items-center justify-center text-ink-3 transition-colors duration-[var(--motion-fast)] ease-standard hover:text-foreground"
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
							size="lg"
							className="w-full"
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
									<ChevronRight className="ml-2 h-4 w-4" aria-hidden />
								</>
							)}
						</Button>
					</form>
				</Form>

				<div className="relative py-2">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t border-rule" />
					</div>
					<div className="relative flex justify-center">
						<span className="type-label bg-surface px-4 text-ink-3">Or</span>
					</div>
				</div>

				<Button
					variant="outline"
					size="lg"
					className="w-full"
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
						/>
					)}
					Continue with Google
				</Button>
			</div>

			<div className="type-body-sm mt-6 text-center text-ink-2">
				Already have an account?{' '}
				<Link
					href="/login"
					className="p-2 font-semibold text-foreground underline-offset-4 hover:underline"
				>
					Log in
				</Link>
			</div>
		</div>
	)
}
