'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRight, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
	const t = useTranslations('core.forgotPassword')
	const tCommon = useTranslations('core.authCommon')
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
			<AuthPageHeader title={t('title')} description={t('description')} />

			<div className="w-full rounded-sm border border-rule bg-surface p-5 sm:p-6">
				<TopLoadingBar show={isPending} />

				{isSuccess ? (
					<>
						<AuthNotice tone="success" title="Check your email" role="status">
							{t('checkEmailBody', { email: variables?.email ?? '' })}
						</AuthNotice>
						<Button
							variant="outline"
							size="lg"
							className="w-full"
							type="button"
							onClick={() => reset()}
						>
							{t('sendAnotherLink')}
						</Button>
					</>
				) : (
					<>
						{isError ? (
							<AuthNotice
								tone="warning"
								title={t('unableToSendTitle')}
								role="alert"
							>
								{error?.message || t('tryAgainMinutes')}
							</AuthNotice>
						) : (
							linkExpired && (
								<AuthNotice
									tone="warning"
									title={t('linkExpiredTitle')}
									role="status"
								>
									{t('linkExpiredBody')}
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
											<FormLabel>{tCommon('email')}</FormLabel>
											{/* FormControl wraps the input itself so the label and
											    error bind to it, not to the icon container. */}
											<div className="relative">
												<Mail
													className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-ink-3"
													aria-hidden
												/>
												<FormControl>
													<Input
														placeholder={tCommon('emailPlaceholder')}
														type="email"
														autoCapitalize="none"
														autoComplete="email"
														autoCorrect="off"
														className="pl-10"
														disabled={isPending}
														{...field}
													/>
												</FormControl>
											</div>
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
											{t('sending')}
										</>
									) : (
										<>
											{t('sendResetLink')}
											<ChevronRight className="ml-2 h-4 w-4" aria-hidden />
										</>
									)}
								</Button>
							</form>
						</Form>
					</>
				)}

				<div className="type-body-sm mt-6 text-center text-ink-2">
					{t('rememberedIt')}{' '}
					<Link
						href="/login"
						className="p-2 font-semibold text-foreground underline-offset-4 hover:underline"
					>
						{tCommon('logIn')}
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
