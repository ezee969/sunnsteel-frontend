'use client'

import { Bell, BellOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { usePushNotifications } from '@/lib/api/hooks/usePushNotifications'

/**
 * NOTIF-02. The permission prompt is raised only from the button here, never
 * on load: a browser gives an origin one chance, and a prompt the user did not
 * ask for is the fastest way to be blocked permanently.
 *
 * Every unavailable case states its own reason rather than hiding the card,
 * because "notifications are missing and I do not know why" is the worse
 * outcome — especially on iOS, where the app has to be installed first.
 */
export function PushNotificationsCard() {
	const push = usePushNotifications()
	const isEnabled = push.availability === 'ENABLED'

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					{isEnabled ? (
						<Bell className="h-5 w-5 text-primary" aria-hidden />
					) : (
						<BellOff className="h-5 w-5 text-ink-3" aria-hidden />
					)}
					<CardTitle>Notifications</CardTitle>
				</div>
				<CardDescription>
					Alerts this device can receive while Sunnsteel is closed.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="space-y-1">
					<p className="type-panel text-foreground">{push.title}</p>
					<p className="type-body-sm max-w-[68ch] text-ink-3">
						{push.description}
					</p>
				</div>

				{push.canEnable ? (
					<Button
						type="button"
						onClick={() => void push.enable()}
						disabled={push.isPending}
					>
						{push.isPending ? 'Enabling…' : 'Enable notifications'}
					</Button>
				) : null}

				{isEnabled ? (
					<Button
						type="button"
						variant="outline"
						onClick={() => void push.disable()}
						disabled={push.isPending}
					>
						{push.isPending ? 'Turning off…' : 'Turn off on this device'}
					</Button>
				) : null}

				{push.error ? (
					<p role="alert" className="type-body-sm text-ink-2">
						{push.error}
					</p>
				) : null}

				<p className="type-body-sm max-w-[68ch] text-ink-3">
					The only alert so far is the end of a rest period, and it names the
					lift that is up next. It cannot show a countdown: notifications have
					no ticking field on any platform.
				</p>
			</CardContent>
		</Card>
	)
}
