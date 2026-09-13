import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function NotFound() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
			<h1 className="type-numeral text-foreground">404</h1>
			<h2 className="type-section text-foreground">Page not found</h2>
			<p className="text-sm text-muted-foreground max-w-md">
				The page you&apos;re looking for doesn&apos;t exist or has been moved.
			</p>
			<Button variant="default" asChild>
				<Link href="/">Go home</Link>
			</Button>
		</div>
	)
}
