import { ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WorkoutItemProps {
	icon: React.ReactNode
	title: string
	duration: string
	dateTime: string
	onClick: () => void
	showSeparator?: boolean
}

/**
 * A ruled workout row, matching `ActivityItem`.
 *
 * The gradient medallion and the duration badge are gone: §4.3 rule 6 retires
 * gradients and §11.12 says read-only data carries no border and no fill.
 *
 * Note: this component currently has no importers. It is restyled rather than
 * deleted because deletion is Phase 15's call, not this batch's.
 */
export default function WorkoutItem({
	icon,
	title,
	duration,
	dateTime,
	onClick,
	showSeparator = true,
}: WorkoutItemProps) {
	return (
		<div
			className={cn(
				'group relative flex items-center gap-3 py-3 transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-surface',
				showSeparator && 'border-b border-rule-faint',
			)}
		>
			<span className="shrink-0 text-ink-3" aria-hidden>
				{icon}
			</span>
			<div className="min-w-0 flex-1">
				<div className="flex items-baseline gap-2">
					<p className="type-panel text-foreground">{title}</p>
					<span className="type-data text-ink-3">{duration}</span>
				</div>
				<p className="type-body-sm text-ink-3">{dateTime}</p>
			</div>
			<Button
				variant="ghost"
				size="icon"
				onClick={onClick}
				className="opacity-0 transition-opacity duration-[var(--motion-fast)] ease-standard group-hover:opacity-100"
			>
				<ChevronRight className="h-4 w-4" />
			</Button>
		</div>
	)
}
