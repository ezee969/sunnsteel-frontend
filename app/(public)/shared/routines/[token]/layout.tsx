import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Shared routine',
	description: 'A Sunnsteel training routine shared with you.',
	// A share link is meant for the people it was sent to, not for search.
	robots: { index: false, follow: false },
}

export default function SharedRoutineLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return children
}
