'use client'

import { Crown } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import { InlineError } from '@/components/layout/inline-error'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import { useBilling, useCancelSubscription } from '@/lib/api/hooks/useBilling'
import {
	canCancelSubscription,
	proUntilIfCancelled,
	showsTestMode,
	subscriptionState,
} from '@/lib/utils/checkout'
import { currentPlan } from '@/lib/utils/plans'

/**
 * BILL-02: the account's plan as the server answered it, and the way to the
 * comparison, where BILL-03 buys Pro. BILL-04: the subscription behind it --
 * its trial, next renewal, a failed payment's grace period or its last day --
 * and cancelling it, which ends nothing early and deletes nothing.
 */
export function PlanCard() {
	const t = useTranslations('billing.settingsPlan')
	const locale = useLocale() as Locale
	const billing = useBilling()
	const cancel = useCancelSubscription()
	const errorText = useApiErrorMessage()
	const { push } = useToast()
	const [confirming, setConfirming] = useState(false)

	const day = (iso: string) =>
		dateFormatter(locale, { dateStyle: 'long' }).format(new Date(iso))
	const plan = billing.data ? currentPlan(billing.data) : null
	const label = !plan
		? null
		: plan.kind === 'FREE'
			? t('free')
			: plan.until
				? t('proUntil', { date: day(plan.until) })
				: t('proNoEnd')

	const subscription = billing.data?.subscription ?? null
	const state = subscriptionState(subscription)
	const stateLine = !state
		? null
		: state.kind === 'TRIALING'
			? state.until
				? t('trialing', { date: day(state.until) })
				: null
			: state.kind === 'ACTIVE'
				? state.renews
					? t('renews', { date: day(state.renews) })
					: t('renewsUnknown')
				: state.kind === 'PAST_DUE'
					? state.until
						? t('pastDue', { date: day(state.until) })
						: null
					: state.until
						? t('canceled', { date: day(state.until) })
						: t('canceledNoDate')
	const lastDay = subscription ? proUntilIfCancelled(subscription) : null

	return (
		<Card id="plan" className="scroll-mt-24">
			<CardHeader>
				<div className="flex items-center gap-2">
					<Crown className="h-5 w-5 text-ink-2" aria-hidden />
					<CardTitle>{t('title')}</CardTitle>
				</div>
				{label ? <CardDescription>{label}</CardDescription> : null}
			</CardHeader>
			<CardContent className="space-y-3">
				{subscription ? (
					<p className="type-body-sm text-ink-2">{t('subscriptionActive')}</p>
				) : null}
				{stateLine ? (
					<p className="type-body-sm max-w-[68ch] text-foreground">
						{stateLine}
					</p>
				) : null}
				{billing.data && showsTestMode(billing.data) ? (
					<p className="type-body-sm text-ink-3">{t('testMode')}</p>
				) : null}
				{cancel.isError ? (
					<InlineError
						title={t('cancel')}
						message={errorText(cancel.error)}
						onRetry={() => setConfirming(true)}
					/>
				) : null}
				<div className="flex flex-wrap gap-2">
					<Button asChild variant="outline" size="sm">
						<Link href="/plans">{t('comparePlans')}</Link>
					</Button>
					{canCancelSubscription(subscription) ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							disabled={cancel.isPending}
							onClick={() => setConfirming(true)}
						>
							{t('cancel')}
						</Button>
					) : null}
				</div>
			</CardContent>

			<AlertDialog
				open={confirming}
				onOpenChange={open => !cancel.isPending && setConfirming(open)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('cancelTitle')}</AlertDialogTitle>
						<AlertDialogDescription>
							{lastDay
								? t('cancelBody', { date: day(lastDay) })
								: t('cancelBodyNoDate')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={cancel.isPending}>
							{t('keep')}
						</AlertDialogCancel>
						<AlertDialogAction
							disabled={cancel.isPending}
							onClick={event => {
								event.preventDefault()
								cancel.mutate(undefined, {
									onSuccess: () => {
										setConfirming(false)
										push({ title: t('cancelled') })
									},
									onError: () => setConfirming(false),
								})
							}}
						>
							{t('cancelConfirm')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	)
}
