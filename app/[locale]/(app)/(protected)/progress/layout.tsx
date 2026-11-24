'use client'

import { useTranslations } from 'next-intl'

import HeroSection from '@/components/layout/HeroSection'
import { PageTabs } from '@/components/layout/page-tabs'
import { ProgressControlsProvider } from '@/features/progress/progress-controls'
import { progressTabs } from '@/lib/utils/progress-tabs'

/**
 * UX-11 and design system §21: Progress in five route tabs, each answering
 * one question and reading only its own data. The masthead, the tab bar and
 * the members' choices stay mounted between tabs.
 */
export default function ProgressLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const t = useTranslations('progress.page')
	const tTabs = useTranslations('progress.tabs')
	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
			<HeroSection title={<>{t('title')}</>} subtitle={<>{t('subtitle')}</>} />
			<PageTabs label={t('sectionsLabel')} tabs={progressTabs(tTabs)} />
			<ProgressControlsProvider>{children}</ProgressControlsProvider>
		</div>
	)
}
