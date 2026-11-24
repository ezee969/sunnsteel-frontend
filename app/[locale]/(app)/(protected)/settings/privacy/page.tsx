'use client'

import { ActivitySharingCard } from '@/features/settings/activity-sharing-card'
import { BlockedMembersCard } from '@/features/settings/blocked-members-card'
import { MessagingSettingsCard } from '@/features/settings/messaging-settings-card'
import { PrivacyOverviewCard } from '@/features/settings/privacy-overview-card'
import { ProfileDiscoverySettingsCard } from '@/features/settings/profile-discovery-settings-card'
import { ProfilePrivacySettingsCard } from '@/features/settings/profile-privacy-settings-card'
import { SettingsTab } from '@/features/settings/settings-tab'
import { TrainingPartnersCard } from '@/features/settings/training-partners-card'
import { useUser } from '@/lib/api/hooks/useUser'

/**
 * Settings › Privacy (UX-12): who can find you and who sees what. The
 * overview comes first because it summarises the cards below it.
 */
export default function SettingsPrivacyPage() {
	const { user } = useUser()
	return (
		<SettingsTab>
			{user ? <PrivacyOverviewCard profile={user} /> : null}
			{user ? (
				<ProfileDiscoverySettingsCard settings={user.discoverySettings} />
			) : null}
			{user ? (
				<ProfilePrivacySettingsCard settings={user.privacySettings} />
			) : null}
			<ActivitySharingCard />
			<TrainingPartnersCard />
			{user ? <MessagingSettingsCard profile={user} /> : null}
			<BlockedMembersCard />
		</SettingsTab>
	)
}
