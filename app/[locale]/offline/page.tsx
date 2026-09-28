import type { Metadata } from 'next'
import Link from 'next/link'

import { RouteError } from '@/components/layout/RouteError'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
	title: 'Offline',
	robots: { index: false },
}

/**
 * TD-44: the page the service worker serves for a navigation that is neither
 * online nor in its page cache. It is static and precached at build time, so
 * it renders with no network at all. Pages already visited still come from
 * the cache first; this is only for the rest.
 */
export default function OfflinePage() {
	return (
		<main className="ledger-page py-10 md:py-16">
			<RouteError
				title="You are offline"
				description="This page has not been saved on this device yet. Pages you have already opened may still load; reconnect to open the rest."
			>
				<Button asChild>
					<Link href="/dashboard">Go to the dashboard</Link>
				</Button>
			</RouteError>
		</main>
	)
}
