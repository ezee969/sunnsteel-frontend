'use client'

import { DeleteAccountCard } from '@/features/settings/delete-account-card'
import { DisplayPreferenceCard } from '@/features/settings/display-preference-card'
import { DownloadDataCard } from '@/features/settings/download-data-card'
import { LanguagePreferenceCard } from '@/features/settings/language-preference-card'
import { MotionPreferenceCard } from '@/features/settings/motion-preference-card'
import { SettingsTab } from '@/features/settings/settings-tab'
import { TimeCalendarCard } from '@/features/settings/time-calendar-card'
import { useUser } from '@/lib/api/hooks/useUser'

/**
 * Settings › Account (UX-12): the account's language (I18N-02), its time
 * zone and week start (PREF-04), this device's
 * motion and display preferences (A11Y-01, A11Y-02), then your
 * data and the account itself. Download stays directly above Delete, which
 * points to it (EXPORT-01, TRUST-01).
 */
export default function SettingsAccountPage() {
	const { user } = useUser()
	return (
		<SettingsTab>
			<LanguagePreferenceCard locale={user?.locale} />
			{user ? <TimeCalendarCard profile={user} /> : null}
			<MotionPreferenceCard />
			<DisplayPreferenceCard />
			<DownloadDataCard />
			{user ? <DeleteAccountCard profile={user} /> : null}
		</SettingsTab>
	)
}
