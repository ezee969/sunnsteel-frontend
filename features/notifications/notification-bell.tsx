'use client'

import { Bell, BellDot } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { useNotifications } from '@/lib/api/hooks/useNotifications'
import { notificationsBellLabel } from '@/lib/utils/navigation-indicators'

import { NotificationMenu } from './notification-menu'

/**
 * NOTIF-01: the top bar's way into the notification center. Unread
 * notifications change the glyph (a bell with a dot) and the accessible name,
 * which carries the count; it is a navigation control, so it never fills.
 * From 768px, where the shell shows its sidebar, it opens the NOTIF-10 menu
 * instead; below that a menu over a phone screen would be the page again.
 */
export function NotificationBell({ menu = false }: { menu?: boolean }) {
	const t = useTranslations('shell.indicators')
	const { data } = useNotifications()
	const unread = data?.unreadCount ?? 0
	const Icon = unread > 0 ? BellDot : Bell
	if (menu) return <NotificationMenu />
	return (
		<Button asChild variant="ghost" size="icon" className="size-11 md:size-10">
			<Link
				href="/notifications"
				aria-label={notificationsBellLabel(unread, t)}
			>
				<Icon className="h-[1.2rem] w-[1.2rem]" aria-hidden />
			</Link>
		</Button>
	)
}
