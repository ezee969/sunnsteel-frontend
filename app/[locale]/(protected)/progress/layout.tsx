import HeroSection from '@/components/layout/HeroSection'
import { PageTabs } from '@/components/layout/page-tabs'
import { ProgressControlsProvider } from '@/features/progress/progress-controls'
import { PROGRESS_TABS } from '@/lib/utils/progress-tabs'

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
	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
			<HeroSection
				title={<>Training Progress</>}
				subtitle={
					<>
						See how your training is distributed, follow record trends, and
						review every performance behind them.
					</>
				}
			/>
			<PageTabs label="Progress sections" tabs={PROGRESS_TABS} />
			<ProgressControlsProvider>{children}</ProgressControlsProvider>
		</div>
	)
}
