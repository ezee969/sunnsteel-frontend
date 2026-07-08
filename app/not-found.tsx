import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
			<h1 className="text-4xl font-bold">404</h1>
			<h2 className="text-xl font-semibold">Page not found</h2>
			<p className="text-sm text-muted-foreground max-w-md">
				The page you&apos;re looking for doesn&apos;t exist or has been moved.
			</p>
			<Button variant="classical" asChild>
				<Link href="/">Go home</Link>
			</Button>
		</div>
	)
}
