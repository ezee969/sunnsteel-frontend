'use client'

import { DeleteAccountCard } from '@/features/settings/delete-account-card'
import { DownloadDataCard } from '@/features/settings/download-data-card'
import { MotionPreferenceCard } from '@/features/settings/motion-preference-card'
import { SettingsTab } from '@/features/settings/settings-tab'
import { useUser } from '@/lib/api/hooks/useUser'

/**
 * Settings › Account (UX-12): this device's motion preference, then your
 * data and the account itself. Download stays directly above Delete, which
 * points to it (EXPORT-01, TRUST-01).
 */
export default function SettingsAccountPage() {
	const { user } = useUser()
	return (
		<SettingsTab>
			<MotionPreferenceCard />
			<DownloadDataCard />
			{user ? <DeleteAccountCard profile={user} /> : null}
		</SettingsTab>
	)
}
