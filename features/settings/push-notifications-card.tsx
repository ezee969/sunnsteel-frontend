'use client'

import { Bell, BellOff } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Explanation } from '@/components/layout/explanation'
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
	const t = useTranslations('settings.pushNotifications')
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
					<CardTitle>{t('title')}</CardTitle>
				</div>
				<CardDescription>{t('description')}</CardDescription>
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
						{push.isPending ? t('enabling') : t('enable')}
					</Button>
				) : null}

				{isEnabled ? (
					<Button
						type="button"
						variant="outline"
						onClick={() => void push.disable()}
						disabled={push.isPending}
					>
						{push.isPending ? t('turningOff') : t('turnOff')}
					</Button>
				) : null}

				{push.error ? (
					<p role="alert" className="type-body-sm text-ink-2">
						{push.error}
					</p>
				) : null}

				<Explanation summary={t('noteSummary')}>
					<p>{t('note')}</p>
				</Explanation>
			</CardContent>
		</Card>
	)
}
