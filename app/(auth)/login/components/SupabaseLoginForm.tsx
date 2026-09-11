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
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
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
	useSupabaseSignIn,
} from '@/lib/api/hooks/useSupabaseAuth'
import { sanitizeInternalRedirect } from '@/lib/utils/internal-redirect'
import { LoginFormValues, loginSchema } from '@/schema/login-schema'

import { TopLoadingBar } from '../../../../components/ui/top-loading-bar'

/**
 * Renders a login UI that supports email/password and Google sign-in via Supabase.
 *
 * Displays a Google sign-in button, an email/password form with schema validation, a top loading bar while authentication is pending, and an error message when sign-in fails. Disables inputs and actions while any authentication request is in progress.
 *
 * @returns The login form React element.
 */
export function SupabaseLoginForm() {
	const { mutate: signIn, isPending, isError, error } = useSupabaseSignIn()
	const { mutate: googleSignIn, isPending: isGooglePending } =
		useSupabaseGoogleSignIn()
	const searchParams = useSearchParams()
	const router = useRouter()
	const targetRedirect = sanitizeInternalRedirect(
		searchParams.get('redirectTo'),
	)
	const message = searchParams.get('message')
	const [showPassword, setShowPassword] = useState(false)

	// Pre-warm the dashboard route to prevent ERR_FAILED during redirect
	// This triggers Next.js to compile the dashboard before login completes
	useEffect(() => {
		router.prefetch('/dashboard')
	}, [router])

	// Initialize form with react-hook-form and zod resolver
	const form = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	})

	// Form submission handler
	function onSubmit(values: LoginFormValues) {
		signIn({ ...values, redirectTo: targetRedirect })
	}

	// Handle Google Sign-In
	function handleGoogleSignIn() {
		googleSignIn(targetRedirect)
	}

	return (
		<div className="w-full rounded-sm border border-rule bg-surface p-5 sm:p-6">
			<TopLoadingBar show={isPending || isGooglePending} />

			{message === 'verify-email' && (
				<div className="type-body-sm mark mark-success mb-6 flex items-start gap-3 bg-surface-sunk p-3 text-foreground">
					<CheckCircle2
						className="mt-0.5 h-5 w-5 shrink-0 text-success"
						aria-hidden
					/>
					<div className="flex-1">
						<p className="type-panel mb-1">Account created!</p>
						<p className="text-ink-2">
							Check your email to verify your account.
						</p>
					</div>
				</div>
			)}

			{isError && (
				<div
					role="alert"
					className="type-body-sm mark mb-6 flex items-start gap-3 border-l-destructive bg-surface-sunk p-3 text-foreground"
				>
					<AlertCircle
						className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
						aria-hidden
					/>
					<div className="flex-1">
						<p className="type-panel mb-1">Unable to sign in</p>
						<p className="text-ink-2">
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
									<div className="flex items-center justify-between">
										<FormLabel>Password</FormLabel>
										<Link
											href="/forgot-password"
											className="type-body-sm -mr-2 p-2 text-ink-2 transition-colors duration-[var(--motion-fast)] ease-standard hover:text-foreground"
											tabIndex={-1}
										>
											Forgot password?
										</Link>
									</div>
									<FormControl>
										<div className="relative">
											<Lock
												className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-ink-3"
												aria-hidden
											/>
											<Input
												type={showPassword ? 'text' : 'password'}
												placeholder="••••••••"
												autoComplete="current-password"
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
							size="lg"
							className="w-full"
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
							className="mr-2 h-4 w-4"
						/>
					)}
					Continue with Google
				</Button>
			</div>

			<div className="type-body-sm mt-6 text-center text-ink-2">
				Don&apos;t have an account?{' '}
				<Link
					href="/signup"
					className="p-2 font-semibold text-foreground underline-offset-4 hover:underline"
				>
					Sign up
				</Link>
			</div>
		</div>
	)
}
