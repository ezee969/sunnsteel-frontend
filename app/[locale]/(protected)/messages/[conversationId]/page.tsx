'use client'

import { useParams } from 'next/navigation'

import { ConversationThread } from '@/features/messages/conversation-thread'

/** MSG-01: one conversation. */
export default function ConversationPage() {
	const params = useParams<{ conversationId: string }>()
	return (
		<div className="mx-auto w-full max-w-3xl">
			<ConversationThread
				key={params.conversationId}
				conversationId={params.conversationId}
			/>
		</div>
	)
}
