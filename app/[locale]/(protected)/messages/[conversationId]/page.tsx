'use client'

import { useParams } from 'next/navigation'
import { Suspense } from 'react'

import { ConversationThread } from '@/features/messages/conversation-thread'
import { useAttachedRoutine } from '@/features/messages/use-attached-routine'

function Conversation({ conversationId }: { conversationId: string }) {
	// MSG-07: "Send in a message" opens the composer with the routine attached.
	const initialRoutine = useAttachedRoutine()
	return (
		<ConversationThread
			key={conversationId}
			conversationId={conversationId}
			initialRoutine={initialRoutine}
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
