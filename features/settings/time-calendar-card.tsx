'use client'

import {
	DEFAULT_WEEK_STARTS_ON,
	isWeekStartsOn,
	type UserProfile,
	type WeekStartsOn,
} from '@sunsteel/contracts'
import { CalendarClock, Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { useToast } from '@/components/ui/toast'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import type { Locale } from '@/i18n/config'
import {
	useChangeTimeZone,
	useUpdateWeekStart,
} from '@/lib/api/hooks/useRegionalPreferences'
import { useWorkoutAnalytics } from '@/lib/api/hooks/useWorkoutAnalytics'
import {
	deviceTimeZone,
	knownTimeZones,
	orderTimeZones,
	timeZoneLabel,
	zonesDiffer,
} from '@/lib/utils/regional'

/**
 * PREF-04: the account's time zone and the day its weeks start on. The zone
 * governs what the server decides -- the day a workout counts on, when a
 * reminder arrives, which plan a date trains -- while screens keep this
 * device's clock, so the card says when the two differ and offers the
 * device's zone in one tap. Both apply at once, like the language.
 */
export function TimeCalendarCard({ profile }: { profile: UserProfile }) {
	const t = useTranslations('settings.timeCalendar')
	const errorText = useApiErrorMessage()
	const locale = useLocale() as Locale
	const { push } = useToast()
	const analytics = useWorkoutAnalytics()
	const changeZone = useChangeTimeZone()
	const updateWeek = useUpdateWeekStart()

	// The latest generation's zone: during a rebuild it is the one asked for.
	const account = analytics.data?.requestedTimeZone ?? profile.timeZone ?? null
	const device = deviceTimeZone()
	const zones = useMemo(
		() => orderTimeZones(knownTimeZones(account, device), account, device),
		[account, device],
	)
	const labels = useMemo(
		() => new Map(zones.map(zone => [zone, timeZoneLabel(zone, locale)])),
		[zones, locale],
	)
	const weekStartsOn: WeekStartsOn = isWeekStartsOn(profile.weekStartsOn)
		? profile.weekStartsOn
		: DEFAULT_WEEK_STARTS_ON
	const rebuilding = analytics.data?.state === 'BUILDING'

	const setZone = (zone: string) => {
		if (!zone || zone === account) return
		changeZone.mutate(zone, {
			onError: error =>
				push({
					title: t('zoneFailed'),
					description: errorText(error),
					variant: 'destructive',
				}),
		})
	}

	const setWeek = (value: string) => {
		const next = Number(value)
		if (!isWeekStartsOn(next) || next === weekStartsOn) return
		updateWeek.mutate(next, {
			onError: error =>
				push({
					title: t('weekFailed'),
					description: errorText(error),
					variant: 'destructive',
				}),
		})
	}

	return (
		<Card id="time-calendar" className="scroll-mt-24">
			<CardHeader>
				<div className="flex items-center gap-2">
					<CalendarClock className="h-5 w-5 text-primary" aria-hidden />
					<CardTitle>{t('title')}</CardTitle>
				</div>
				<CardDescription>{t('description')}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-2">
					<Label htmlFor="account-time-zone">{t('zoneLabel')}</Label>
					<div className="flex items-center gap-2">
						<NativeSelect
							id="account-time-zone"
							className="w-full sm:max-w-sm"
							value={account ?? ''}
							disabled={changeZone.isPending || !account}
							onChange={event => setZone(event.target.value)}
						>
							{zones.map(zone => (
								<option key={zone} value={zone}>
									{labels.get(zone)}
								</option>
							))}
						</NativeSelect>
						{changeZone.isPending ? (
							<Loader2
								className="size-4 shrink-0 animate-spin text-ink-3"
								aria-label={t('saving')}
							/>
						) : null}
					</div>
					<p className="type-body-sm max-w-[68ch] text-ink-3">
						{t('zoneNote')}
					</p>
					{rebuilding ? (
						<p role="status" className="type-body-sm text-ink-2">
							{t('rebuilding')}
						</p>
					) : null}
					{account && device && zonesDiffer(account, device) ? (
						<div className="mark mark-warning space-y-2 pl-3">
							<p className="type-body-sm text-ink-2">
								{t('deviceDiffers', {
									device: labels.get(device) ?? device,
									account: labels.get(account) ?? account,
								})}
							</p>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={changeZone.isPending}
								onClick={() => setZone(device)}
							>
								{t('useDevice')}
							</Button>
						</div>
					) : null}
				</div>

				<div className="space-y-2">
					<Label htmlFor="account-week-start">{t('weekLabel')}</Label>
					<div className="flex items-center gap-2">
						<NativeSelect
							id="account-week-start"
							className="w-full sm:max-w-xs"
							value={String(weekStartsOn)}
							disabled={updateWeek.isPending}
							onChange={event => setWeek(event.target.value)}
						>
							<option value="1">{t('monday')}</option>
							<option value="0">{t('sunday')}</option>
						</NativeSelect>
						{updateWeek.isPending ? (
							<Loader2
								className="size-4 shrink-0 animate-spin text-ink-3"
								aria-label={t('saving')}
							/>
						) : null}
					</div>
					<p className="type-body-sm max-w-[68ch] text-ink-3">
						{t('weekNote')}
					</p>
				</div>
			</CardContent>
		</Card>
	)
}
