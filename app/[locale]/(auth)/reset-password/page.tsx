'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRight, Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { ClassicalLoader } from '@/components/ui/classical-loader'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { TopLoadingBar } from '@/components/ui/top-loading-bar'
import { useUpdatePassword } from '@/lib/api/hooks/useSupabaseAuth'
import { FORGOT_PASSWORD_PATH } from '@/lib/auth/password-reset'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'
import {
	resetPasswordSchema,
	type ResetPasswordValues,
} from '@/schema/password-reset-schema'

import { AuthNotice, AuthPageHeader } from '../components/AuthPageParts'

const PASSWORD_FIELDS = [
	{ name: 'password', label: 'New password', autoComplete: 'new-password' },
	{
		name: 'confirmPassword',
		label: 'Confirm new password',
		autoComplete: 'new-password',
	},
] as const

/**
 * FIX-11: choose a new password. The emailed link signs the user in through
 * `/auth/callback`, so this page needs a session; without one the link was
 * expired or already used, and the page says so instead of showing a form
 * that cannot succeed.
 */
export default function ResetPasswordPage() {
	const { session, isLoading } = useSupabaseAuth()
	const { mutate, isPending, isError, error, isSuccess } = useUpdatePassword()
	const [showPassword, setShowPassword] = useState(false)

	const form = useForm<ResetPasswordValues>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: { password: '', confirmPassword: '' },
	})

	if (isLoading) {
		return (
			<div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
				<ClassicalLoader size="md" label="Checking your reset link" />
				<p className="type-body-sm text-ink-3">Checking your reset link...</p>
			</div>
		)
	}

	return (
		<div>
			<AuthPageHeader
				title="Choose a New Password"
				description="Pick the password you'll use to sign in from now on."
			/>

			<div className="w-full rounded-sm border border-rule bg-surface p-5 sm:p-6">
				<TopLoadingBar show={isPending} />

				{isSuccess ? (
					<>
						<AuthNotice tone="success" title="Password updated" role="status">
							You&apos;re signed in with your new password.
						</AuthNotice>
						<Button asChild size="lg" className="w-full">
							<Link href="/dashboard">
								Go to Dashboard
								<ChevronRight className="ml-2 h-4 w-4" aria-hidden />
							</Link>
						</Button>
					</>
				) : !session ? (
					<>
						<AuthNotice tone="warning" title="This link can't be used">
							Reset links expire and work only once, and this page opens only
							from one. Request a new link to continue.
						</AuthNotice>
						<Button asChild size="lg" className="w-full">
							<Link href={FORGOT_PASSWORD_PATH}>
								Request a new link
								<ChevronRight className="ml-2 h-4 w-4" aria-hidden />
							</Link>
						</Button>
					</>
				) : (
					<>
						{isError && (
							<AuthNotice
								tone="warning"
								title="Unable to update your password"
								role="alert"
							>
								{error?.message || 'Please try again.'}
							</AuthNotice>
						)}

						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(values =>
									mutate({ password: values.password }),
								)}
								className="space-y-4"
								aria-busy={isPending}
							>
								{PASSWORD_FIELDS.map(({ name, label, autoComplete }) => (
									<FormField
										key={name}
										control={form.control}
										name={name}
										render={({ field }) => (
											<FormItem>
												<FormLabel>{label}</FormLabel>
												<div className="relative">
													<Lock
														className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-ink-3"
														aria-hidden
													/>
													<FormControl>
														<Input
															type={showPassword ? 'text' : 'password'}
															placeholder="••••••••"
															autoComplete={autoComplete}
															className="pl-10 pr-11"
															disabled={isPending}
															{...field}
														/>
													</FormControl>
													{name === 'password' && (
														<button
															type="button"
															onClick={() => setShowPassword(!showPassword)}
															aria-label={
																showPassword
																	? 'Hide passwords'
																	: 'Show passwords'
															}
															className="absolute right-0 top-0 flex h-full w-11 items-center justify-center text-ink-3 transition-colors duration-[var(--motion-fast)] ease-standard hover:text-foreground"
															disabled={isPending}
														>
															{showPassword ? (
																<EyeOff className="h-4 w-4" />
															) : (
																<Eye className="h-4 w-4" />
															)}
														</button>
													)}
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>
								))}

								<Button
									size="lg"
									className="w-full"
									type="submit"
									disabled={isPending}
								>
									{isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Updating...
										</>
									) : (
										'Update password'
									)}
								</Button>
							</form>
						</Form>
					</>
				)}
			</div>
		</div>
	)
}
