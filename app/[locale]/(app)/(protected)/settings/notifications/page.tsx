'use client'

import { NotificationControlsCard } from '@/features/settings/notification-controls-card'
import { PushNotificationsCard } from '@/features/settings/push-notifications-card'
import { SettingsTab } from '@/features/settings/settings-tab'

/**
 * Settings › Notifications (UX-12): whether this device receives them, then
 * what may reach you, in that order because the controls speak of the card
 * above them.
 */
export default function SettingsNotificationsPage() {
	return (
		<SettingsTab>
			<PushNotificationsCard />
			<NotificationControlsCard />
		</SettingsTab>
	)
}
