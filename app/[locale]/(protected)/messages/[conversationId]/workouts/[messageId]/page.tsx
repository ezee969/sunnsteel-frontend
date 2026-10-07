'use client'

import { useParams } from 'next/navigation'

import { MessageWorkoutView } from '@/features/messages/message-workout-view'

/** MSG-10: a workout a message shared, to read. */
export default function MessageWorkoutPage() {
	const params = useParams<{ conversationId: string; messageId: string }>()
	return (
		<div className="mx-auto w-full max-w-3xl">
			<MessageWorkoutView
				key={params.messageId}
				conversationId={params.conversationId}
				messageId={params.messageId}
			/>
		</div>
	)
}
