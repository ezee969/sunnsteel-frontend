'use client'

import { useParams } from 'next/navigation'

import { MessageRoutineView } from '@/features/messages/message-routine-view'

/** MSG-07: a routine a message shared, to read and copy. */
export default function MessageRoutinePage() {
	const params = useParams<{ conversationId: string; messageId: string }>()
	return (
		<div className="mx-auto w-full max-w-3xl">
			<MessageRoutineView
				key={params.messageId}
				conversationId={params.conversationId}
				messageId={params.messageId}
			/>
		</div>
	)
}
