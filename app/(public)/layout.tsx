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
				{/* TD-35: at 320 this row needed 353px. Below `sm` the wordmark steps
				    down to 16px and the gaps and button padding tighten; the theme
				    toggle keeps its 44px target (a11y review 12). */}
				<div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
					<Link
						href="/"
						className="type-wordmark text-base text-foreground sm:text-xl"
					>
						SUNNSTEEL
					</Link>
					<div className="flex items-center gap-1 sm:gap-2">
						<ModeToggle />
						<Button
							asChild
							variant="ghost"
							size="sm"
							className="px-2.5 sm:px-3"
						>
							<Link href="/login">Sign in</Link>
						</Button>
						<Button asChild size="sm" className="px-2.5 sm:px-3">
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
