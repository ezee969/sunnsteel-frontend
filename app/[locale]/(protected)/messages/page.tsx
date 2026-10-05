'use client'

import { useTranslations } from 'next-intl'

import HeroSection from '@/components/layout/HeroSection'
import { ConversationList } from '@/features/messages/conversation-list'

/** MSG-01: the member's conversations. */
export default function MessagesPage() {
	const t = useTranslations('messaging.list')
	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-6 sm:gap-8">
			<HeroSection
				title={<>{t('pageTitle')}</>}
				subtitle={<>{t('pageSubtitle')}</>}
			/>
			<section aria-label={t('regionTitle')}>
				<ConversationList />
			</section>
		</div>
	)
}
