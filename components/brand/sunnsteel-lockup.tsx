import { cn } from '@/lib/utils'

/**
 * The brand mark: a sun disc above a barbell - the two shapes the app icon is
 * already built from, reduced to five strokes so the glyph survives at 16px.
 *
 * Authored rather than drawn through `ClassicalIcon`: that component is the
 * classical *icon set*, loaded by CSS mask from `/public/icons/classical/`, and
 * a brand mark is neither part of that set nor worth a second network request
 * in the shell header. Inline SVG also inherits `currentColor` directly, so the
 * mark takes the same ink as the wordmark beside it in both themes.
 *
 * Geometry is tuned to the 24-unit box: the bar sits on y=18 with the plates
 * centred on it (14-22) and the collars inside them (16-20), so every vertical
 * edge lands on an integer at 24px and the mark stays crisp in the sidebar.
 */
export function SunnsteelMark({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="butt"
			aria-hidden="true"
			focusable="false"
			className={cn('size-6 shrink-0', className)}
		>
			<circle cx="12" cy="7" r="4.5" />
			<path d="M3 18h18" />
			<path d="M8 14v8M16 14v8" />
			<path d="M4 16v4M20 16v4" />
		</svg>
	)
}

/**
 * The full lockup. The wordmark is `.type-wordmark` (§5.2), so its size comes
 * from the call site's text utility; size the mark to match with `markClassName`
 * - roughly 1.2x the wordmark's cap height reads as one object rather than two.
 *
 * `wordmarkClassName` exists for the one place that hides the word and keeps the
 * mark: the public header at 320, where TD-35 already measured the row at its
 * limit. Where the word is hidden, the call site owns the accessible name.
 */
export function SunnsteelLockup({
	className,
	markClassName,
	wordmarkClassName,
}: {
	className?: string
	markClassName?: string
	wordmarkClassName?: string
}) {
	return (
		<span className={cn('inline-flex items-center gap-2.5', className)}>
			<SunnsteelMark className={markClassName} />
			<span className={cn('type-wordmark', wordmarkClassName)}>SUNNSTEEL</span>
		</span>
	)
}
