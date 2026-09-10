import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Member profile',
	description: 'A Sunnsteel member profile shared with you.',
}

export default function SharedProfileLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return children
}
