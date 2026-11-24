'use client'

import { useTranslations } from 'next-intl'

import { PageTabs } from '@/components/layout/page-tabs'
import { settingsTabs } from '@/lib/utils/settings-tabs'

/**
 * UX-12 and design system §21: Settings in five route tabs, grouped by what
 * someone comes to change. The masthead and the tab bar stay mounted between
 * tabs; an unsaved draft on one tab does not survive leaving it.
 */
export default function SettingsLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const t = useTranslations('settings.page')
	const tTabs = useTranslations('settings.tabs')
	return (
		<div className="mx-auto flex max-w-4xl flex-col gap-8">
			<div className="rule-heading pb-4">
				<h1 className="type-page corner-brackets inline-block text-foreground">
					{t('title')}
				</h1>
				<p className="mt-2 max-w-[68ch] text-sm text-ink-2 sm:text-base">
					{t('subtitle')}
				</p>
			</div>
			<PageTabs label={t('sectionsLabel')} tabs={settingsTabs(tTabs)} />
			{children}
		</div>
	)
}
