import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Shared workout',
	description: 'A Sunnsteel workout shared with you.',
	// A share link is meant for the people it was sent to, not for search.
	robots: { index: false, follow: false },
}

export default function SharedSessionLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return children
}
