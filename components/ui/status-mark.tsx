import { Check, Circle, CircleDot, Minus, TriangleAlert, X } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

// UX-24 (audit 2026-10, DS1): one way to say where a thing stands. Every
// status is a glyph plus a word, so colour never carries it alone (§4.3 rule
// 8). The glyph takes the role's mark-grade token; the word stays ink, because
// a list of statuses in coloured text is the chatter §5.3 removed.
export type StatusState =
	'done' | 'current' | 'upcoming' | 'skipped' | 'endedEarly' | 'error'

const GLYPHS: Record<StatusState, typeof Check> = {
	done: Check,
	current: CircleDot,
	upcoming: Circle,
	skipped: Minus,
	endedEarly: TriangleAlert,
	error: X,
}

const GLYPH_TONES: Record<StatusState, string> = {
	done: 'text-success-strong',
	current: 'text-foreground',
	upcoming: 'text-ink-3',
	skipped: 'text-ink-3',
	endedEarly: 'text-warning-strong',
	error: 'text-destructive',
}

// The `.mark` left rule a row in this state carries, if any. Only outcomes
// are marked: a row still to do, or under way, keeps the transparent rule so
// it stays on its neighbours' left axis.
const RULES: Record<StatusState, string> = {
	done: 'mark-success',
	current: '',
	upcoming: '',
	skipped: '',
	endedEarly: 'mark-warning',
	error: '',
}

export function statusMarkRule(state: StatusState): string {
	return RULES[state]
}

type StatusMarkProps = Omit<React.ComponentProps<'span'>, 'children'> & {
	state: StatusState
	label: string
}

function StatusMark({ state, label, className, ...props }: StatusMarkProps) {
	const Glyph = GLYPHS[state]
	return (
		<span
			data-slot="status-mark"
			data-state={state}
			className={cn(
				'type-body-sm inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap',
				state === 'current' ? 'text-foreground' : 'text-ink-2',
				className,
			)}
			{...props}
		>
			<Glyph
				aria-hidden
				className={cn('size-4 shrink-0', GLYPH_TONES[state])}
				strokeWidth={state === 'done' ? 2.5 : 2}
			/>
			{label}
		</span>
	)
}

export { StatusMark }
