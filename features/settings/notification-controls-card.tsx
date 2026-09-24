'use client'

import type { NotificationCategory } from '@sunsteel/contracts'
import { SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
	useNotificationPreferences,
	useUpdateNotificationPreferences,
} from '@/lib/api/hooks/useNotificationPreferences'
import {
	CATEGORY_DESCRIPTIONS,
	CATEGORY_LABELS,
	describeQuietHours,
	describeReminder,
	describeTimeZone,
	formatMinuteOfDay,
	parseMinuteOfDay,
	PREFERENCES_NOTICE_COPY,
	preferencesNotice,
} from '@/lib/utils/notification-preferences'

const DEFAULT_QUIET_START = 22 * 60
const DEFAULT_QUIET_END = 7 * 60
const TRAINING_CATEGORIES = [
	'REST_ALERT',
	'TRAINING_REMINDER',
	'STREAK_AT_RISK',
] as const satisfies readonly NotificationCategory[]
const PARTNER_CATEGORIES = [
	'TRAINING_PARTNER_SESSION',
	'TRAINING_PARTNER_ACHIEVEMENT',
] as const satisfies readonly NotificationCategory[]

/**
 * NOTIF-05, with the NOTIF-04 reminder time inside it because a reminder with
 * no time is not a reminder. It sits below the Notifications card, which owns
 * whether this device can receive anything at all.
 *
 * There is no channel control: Web Push is the only delivery channel, so a
 * channel switch would be the category switch under another name.
 */
export function NotificationControlsCard() {
	const { data, isPending } = useNotificationPreferences()
	const update = useUpdateNotificationPreferences()

	if (isPending) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Notification controls</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<Skeleton className="h-10" />
					<Skeleton className="h-10" />
				</CardContent>
			</Card>
		)
	}

	if (!data) return null

	const { preferences } = data
	const notice = preferencesNotice(data)
	const quietHours = preferences.quietHours
	const reminderMinute = preferences.reminder.minuteOfDay
	const canRemind = preferences.timeZone !== null
	const categoryRow = (category: NotificationCategory) => {
		const id = `notify-${category}`
		return (
			<div
				key={category}
				className="grid min-h-14 grid-cols-[minmax(0,1fr)_44px] items-center gap-3"
			>
				<div className="space-y-1">
					<Label htmlFor={id}>{CATEGORY_LABELS[category]}</Label>
					<p className="type-body-sm max-w-[68ch] text-ink-3">
						{CATEGORY_DESCRIPTIONS[category]}
					</p>
				</div>
				<Label
					htmlFor={id}
					className="flex size-11 cursor-pointer items-center justify-center"
				>
					<Checkbox
						id={id}
						checked={preferences.categories[category]}
						disabled={update.isPending}
						onCheckedChange={checked =>
							update.mutate({
								categories: { [category]: checked === true },
							})
						}
						aria-label={CATEGORY_LABELS[category]}
						className="size-5"
					/>
				</Label>
			</div>
		)
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<SlidersHorizontal className="h-5 w-5 text-primary" aria-hidden />
					<CardTitle>Notification controls</CardTitle>
				</div>
				<CardDescription>
					What Sunnsteel may notify you about, and when it may not.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{notice ? (
					<p role="status" className="type-body-sm max-w-[68ch] text-ink-2">
						{PREFERENCES_NOTICE_COPY[notice]}
					</p>
				) : null}

				<div className="space-y-3">
					<p className="type-panel text-foreground">Training and rest</p>
					{TRAINING_CATEGORIES.map(categoryRow)}
				</div>

				<div className="space-y-3 border-t border-rule pt-4">
					<div className="space-y-1">
						<p className="type-panel text-foreground">Partner activity</p>
						<p className="type-body-sm max-w-[68ch] text-ink-3">
							Off by default. An alert is created only while the partnership,
							their activity grant and the event&apos;s sharing are all still
							active. Turning one on starts with new activity from that moment.
						</p>
					</div>
					{PARTNER_CATEGORIES.map(categoryRow)}
				</div>

				<div className="space-y-2 border-t border-rule pt-4">
					<Label htmlFor="reminder-time">Reminder time</Label>
					<p className="type-body-sm max-w-[68ch] text-ink-3">
						Sunnsteel knows which days you train, not what hour, so this is the
						time you choose rather than a countdown to a session.
					</p>
					<div className="flex flex-wrap items-center gap-2">
						<Input
							id="reminder-time"
							type="time"
							className="w-36"
							disabled={update.isPending || !canRemind}
							value={
								reminderMinute === null ? '' : formatMinuteOfDay(reminderMinute)
							}
							onChange={event => {
								const minuteOfDay = parseMinuteOfDay(event.target.value)
								if (minuteOfDay === null) return
								update.mutate({ reminder: { minuteOfDay } })
							}}
						/>
						{reminderMinute !== null ? (
							<Button
								type="button"
								size="sm"
								variant="outline"
								disabled={update.isPending}
								onClick={() =>
									update.mutate({ reminder: { minuteOfDay: null } })
								}
							>
								Turn off
							</Button>
						) : null}
					</div>
					<p className="type-body-sm text-ink-3">
						{describeReminder(reminderMinute)}
					</p>
					<p className="type-body-sm text-ink-3">
						{describeTimeZone(preferences.timeZone)}
					</p>
				</div>

				<div className="space-y-2 border-t border-rule pt-4">
					<p id="quiet-hours" className="type-panel text-foreground">
						Quiet hours
					</p>
					<div
						role="group"
						aria-labelledby="quiet-hours"
						className="flex flex-wrap items-end gap-3"
					>
						<div className="space-y-1">
							<Label htmlFor="quiet-start">From</Label>
							<Input
								id="quiet-start"
								type="time"
								className="w-36"
								disabled={update.isPending}
								value={formatMinuteOfDay(
									quietHours?.startMinute ?? DEFAULT_QUIET_START,
								)}
								onChange={event => {
									const startMinute = parseMinuteOfDay(event.target.value)
									if (startMinute === null) return
									update.mutate({
										quietHours: {
											startMinute,
											endMinute: quietHours?.endMinute ?? DEFAULT_QUIET_END,
										},
									})
								}}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="quiet-end">To</Label>
							<Input
								id="quiet-end"
								type="time"
								className="w-36"
								disabled={update.isPending}
								value={formatMinuteOfDay(
									quietHours?.endMinute ?? DEFAULT_QUIET_END,
								)}
								onChange={event => {
									const endMinute = parseMinuteOfDay(event.target.value)
									if (endMinute === null) return
									update.mutate({
										quietHours: {
											startMinute:
												quietHours?.startMinute ?? DEFAULT_QUIET_START,
											endMinute,
										},
									})
								}}
							/>
						</div>
						{quietHours ? (
							<Button
								type="button"
								size="sm"
								variant="outline"
								disabled={update.isPending}
								onClick={() => update.mutate({ quietHours: null })}
							>
								Clear
							</Button>
						) : null}
					</div>
					<p className="type-body-sm max-w-[68ch] text-ink-3">
						{describeQuietHours(quietHours)}
					</p>
				</div>

				{update.isError ? (
					<p role="alert" className="type-body-sm text-ink-2">
						That change was not saved. The values above are still what the
						server has.
					</p>
				) : null}
			</CardContent>
		</Card>
	)
}
