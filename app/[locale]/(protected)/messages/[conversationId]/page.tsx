'use client'

import { useParams } from 'next/navigation'
import { Suspense } from 'react'

import { ConversationThread } from '@/features/messages/conversation-thread'
import { useAttachedObject } from '@/features/messages/use-attached-object'

function Conversation({ conversationId }: { conversationId: string }) {
	// MSG-07/MSG-10: "Send in a message" opens the composer with it attached.
	const initialAttachment = useAttachedObject()
	return (
		<ConversationThread
			key={conversationId}
			conversationId={conversationId}
			initialAttachment={initialAttachment}
		/>
	)
}

/** MSG-01: one conversation. */
export default function ConversationPage() {
	const params = useParams<{ conversationId: string }>()
	return (
		<div className="mx-auto w-full max-w-3xl">
			<Suspense fallback={null}>
				<Conversation conversationId={params.conversationId} />
			</Suspense>
		</div>
	)
}
