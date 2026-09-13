'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRight, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
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
import { TopLoadingBar } from '@/components/ui/top-loading-bar'
import { useRequestPasswordReset } from '@/lib/api/hooks/useSupabaseAuth'
import {
	forgotPasswordSchema,
	type ForgotPasswordValues,
} from '@/schema/password-reset-schema'

import { AuthNotice, AuthPageHeader } from '../components/AuthPageParts'

// Force dynamic rendering to avoid SSG issues with useSearchParams
export const dynamic = 'force-dynamic'

/**
 * FIX-11: request a password-reset email. The confirmation never says whether
 * the address has an account, so the page cannot be used to probe for one.
 */
function ForgotPasswordContent() {
	const searchParams = useSearchParams()
	const linkExpired = searchParams.get('link') === 'expired'
	const { mutate, reset, isPending, isError, error, isSuccess, variables } =
		useRequestPasswordReset()

	const form = useForm<ForgotPasswordValues>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: { email: '' },
	})

	return (
		<div>
			<AuthPageHeader
				title="Reset Password"
				description="Enter the email you sign in with and we'll send you a link to choose a new password."
			/>

			<div className="w-full rounded-sm border border-rule bg-surface p-5 sm:p-6">
				<TopLoadingBar show={isPending} />

				{isSuccess ? (
					<>
						<AuthNotice tone="success" title="Check your email" role="status">
							If an account exists for {variables?.email}, a link to choose a
							new password is on its way. It can take a few minutes, so check
							your spam folder too. The link works once.
						</AuthNotice>
						<Button
							variant="outline"
							size="lg"
							className="w-full"
							type="button"
							onClick={() => reset()}
						>
							Send another link
						</Button>
					</>
				) : (
					<>
						{isError ? (
							<AuthNotice
								tone="warning"
								title="Unable to send the link"
								role="alert"
							>
								{error?.message || 'Please try again in a few minutes.'}
							</AuthNotice>
						) : (
							linkExpired && (
								<AuthNotice
									tone="warning"
									title="That link can't be used"
									role="status"
								>
									Reset links expire and work only once. Request a new one
									below.
								</AuthNotice>
							)
						)}

						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(values => mutate(values))}
								className="space-y-4"
								aria-busy={isPending}
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
														disabled={isPending}
														{...field}
													/>
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
									disabled={isPending}
								>
									{isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Sending...
										</>
									) : (
										<>
											Send reset link
											<ChevronRight className="ml-2 h-4 w-4" aria-hidden />
										</>
									)}
								</Button>
							</form>
						</Form>
					</>
				)}

				<div className="type-body-sm mt-6 text-center text-ink-2">
					Remembered it?{' '}
					<Link
						href="/login"
						className="p-2 font-semibold text-foreground underline-offset-4 hover:underline"
					>
						Log in
					</Link>
				</div>
			</div>
		</div>
	)
}

export default function ForgotPasswordPage() {
	return (
		<Suspense fallback={null}>
			<ForgotPasswordContent />
		</Suspense>
	)
}
