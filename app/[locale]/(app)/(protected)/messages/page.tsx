'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Suspense } from 'react'

import HeroSection from '@/components/layout/HeroSection'
import { PageTabs } from '@/components/layout/page-tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ConversationList } from '@/features/messages/conversation-list'
import { useConversationRequestCount } from '@/lib/api/hooks/useConversations'

/**
 * MSG-02: the inbox and the requests waiting for the member, as page tabs
 * (design system §21) with the view in the query, as Activity's are. The
 * Requests tab carries its number; requests never count in the navigation.
 */
function MessageViews() {
	const t = useTranslations('messaging.list')
	const requests = useConversationRequestCount()
	const showRequests = useSearchParams().get('view') === 'requests'
	const tabs = [
		{ href: '/messages', label: t('inboxTab') },
		{
			href: '/messages?view=requests',
			label: t('requestsTab', { count: requests.data ?? 0 }),
		},
	]
	return (
		<>
			<PageTabs label={t('viewsLabel')} tabs={tabs} />
			<section
				aria-label={showRequests ? t('requestsRegion') : t('regionTitle')}
			>
				<ConversationList box={showRequests ? 'REQUESTS' : 'INBOX'} />
			</section>
		</>
	)
}

/** MSG-01: the member's conversations. */
export default function MessagesPage() {
	const t = useTranslations('messaging.list')
	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-6 sm:gap-8">
			<HeroSection
				title={<>{t('pageTitle')}</>}
				subtitle={<>{t('pageSubtitle')}</>}
			/>
			<Suspense fallback={<Skeleton className="h-40" />}>
				<MessageViews />
			</Suspense>
		</div>
	)
}
