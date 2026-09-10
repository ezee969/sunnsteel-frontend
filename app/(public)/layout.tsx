import Link from 'next/link'

import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'

export default function PublicLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className="min-h-screen bg-background">
			<header className="sticky top-0 z-30 border-b border-rule bg-background">
				<div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
					<Link
						href="/"
						className="heading-classical text-xl font-black tracking-tight text-foreground"
					>
						SUNNSTEEL
					</Link>
					<div className="flex items-center gap-2">
						<ModeToggle />
						<Button asChild variant="ghost" size="sm">
							<Link href="/login">Sign in</Link>
						</Button>
						<Button asChild size="sm">
							<Link href="/signup">Join</Link>
						</Button>
					</div>
				</div>
			</header>
			<main className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-6 sm:py-10">
				{children}
			</main>
		</div>
	)
}
