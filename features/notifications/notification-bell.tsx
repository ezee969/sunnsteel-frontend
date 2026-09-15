'use client'

import { Bell, BellDot } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { useNotifications } from '@/lib/api/hooks/useNotifications'
import { notificationsBellLabel } from '@/lib/utils/notifications'

/**
 * NOTIF-01: the top bar's way into the notification center. Unread
 * notifications change the glyph (a bell with a dot) and the accessible name,
 * which carries the count; it is a navigation control, so it never fills.
 */
export function NotificationBell() {
	const { data } = useNotifications()
	const unread = data?.unreadCount ?? 0
	const Icon = unread > 0 ? BellDot : Bell
	return (
		<Button asChild variant="ghost" size="icon" className="size-11 md:size-10">
			<Link href="/notifications" aria-label={notificationsBellLabel(unread)}>
				<Icon className="h-[1.2rem] w-[1.2rem]" aria-hidden />
			</Link>
		</Button>
	)
}
