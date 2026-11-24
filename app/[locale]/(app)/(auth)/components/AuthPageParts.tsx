import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * The page inscription shared by the signed-out pages (§11.11): Cinzel over
 * the double rule with the one pair of corner brackets, as on Login.
 */
export function AuthPageHeader({
	title,
	description,
}: {
	title: string
	description: string
}) {
	return (
		<div className="rule-heading mb-8 pb-4">
			<h1 className="type-page corner-brackets inline-block text-foreground">
				{title}
			</h1>
			<p className="type-body-sm mt-2 text-ink-2">{description}</p>
		</div>
	)
}

/**
 * A status note above an auth form. `success` is the completion language
 * (§4.3 rule 2); `warning` carries risk as a mark and a glyph with the words
 * in ink (rule 4) — failures here destroy nothing, so they are not crimson.
 */
export function AuthNotice({
	tone,
	title,
	children,
	role,
}: {
	tone: 'success' | 'warning'
	title: string
	children: ReactNode
	role?: 'alert' | 'status'
}) {
	const Icon = tone === 'success' ? CheckCircle2 : AlertTriangle
	return (
		<div
			role={role}
			className={`type-body-sm mark mb-6 flex items-start gap-3 bg-surface-sunk p-3 text-foreground ${
				tone === 'success' ? 'mark-success' : 'mark-warning'
			}`}
		>
			<Icon
				className={`mt-0.5 h-5 w-5 shrink-0 ${
					tone === 'success' ? 'text-success' : 'text-warning-strong'
				}`}
				aria-hidden
			/>
			<div className="flex-1">
				<p className="type-panel mb-1">{title}</p>
				<div className="text-ink-2">{children}</div>
			</div>
		</div>
	)
}
