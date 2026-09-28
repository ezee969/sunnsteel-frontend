import Link from 'next/link'

import { SunnsteelLockup } from '@/components/brand/sunnsteel-lockup'
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
				{/* TD-35: at 320 this row needed 353px. Below `sm` the gaps and button
				    padding tighten and the theme toggle keeps its 44px target (a11y
				    review 12). The wordmark used to step down to 16px there; it is now
				    dropped entirely below `sm` and the brand mark stands alone, which
				    buys the row back ~40px rather than spending any. The link carries
				    the name in both states, so hiding the word costs no label. */}
				<div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
					<Link href="/" aria-label="Sunnsteel" className="text-foreground">
						<SunnsteelLockup
							className="text-xl"
							markClassName="size-7 sm:size-6"
							wordmarkClassName="hidden sm:inline"
						/>
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
