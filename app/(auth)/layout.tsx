'use client'

import { useEffect, useState } from 'react'

import { ModeToggle } from '@/components/mode-toggle'

/**
 * The signed-out shell.
 *
 * Final review 3 / TD-31: this was visually a separate product — a glowing
 * grid, amber blur blobs, a vignette, a gradient-clipped wordmark and a
 * split-screen panel holding an inspirational quote, with the actual task
 * underweighted beside it. It is rebuilt on the protected product's grammar:
 * the same ground, the same topbar (wordmark left, theme control right, one
 * rule below, §11.10), and the form as the page's single subject.
 *
 * The page-level fade-and-rise is gone (§9.2). The `mounted` gate is kept
 * exactly as it was: children and the theme control render only after mount.
 */
export default function AuthLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	return (
		<div className="flex min-h-screen w-full flex-col bg-background text-foreground">
			<header className="flex h-14 shrink-0 items-center justify-between border-b border-rule px-4 md:h-16 md:px-8">
				<span className="type-wordmark text-xl text-foreground">SUNNSTEEL</span>
				{mounted ? (
					<ModeToggle />
				) : (
					<span className="size-11 md:size-10" aria-hidden />
				)}
			</header>
			<main className="flex-1">
				<div className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
					{mounted ? children : null}
				</div>
			</main>
		</div>
	)
}
