import Link from 'next/link'

import { RouteError } from '@/components/layout/RouteError'
import { Button } from '@/components/ui/button'

export default function NotFound() {
	return (
		<main className="ledger-page space-y-2 py-10 md:py-16">
			{/* The number is this block's headline, so it keeps the large-numeral
			    rank (§5.3); the inscription below it is the page's heading. */}
			<p className="type-numeral text-ink-3" aria-hidden>
				404
			</p>
			<RouteError
				title="Page not found"
				description="The page you're looking for doesn't exist or has been moved."
			>
				<Button asChild>
					<Link href="/">Go home</Link>
				</Button>
			</RouteError>
		</main>
	)
}
