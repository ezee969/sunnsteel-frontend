'use client'

import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CommonSplitCardProps {
	readonly name: string
	readonly description: string
	readonly dayCount: number
	readonly isSelected: boolean
	readonly isMobile: boolean
	readonly onSelect: () => void
}

/**
 * a11y review 9: the selected state was a ring and a fill only; it is now
 * `aria-pressed` as well. a11y review 11: the 10px description and badge are
 * raised to the system's 13px body-small and 12px label ranks.
 */
export const CommonSplitCard = ({
	name,
	description,
	dayCount,
	isSelected,
	isMobile,
	onSelect,
}: CommonSplitCardProps) => {
	const t = useTranslations('routines.trainingDays')
	return (
		<Card
			className={cn(
				'cursor-pointer transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-muted',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
				isSelected && 'bg-surface ring-2 ring-inset ring-primary',
				isMobile ? 'min-h-16' : 'min-h-20',
			)}
			role="button"
			tabIndex={0}
			aria-pressed={isSelected}
			aria-label={t('selectSplit', { name, days: dayCount })}
			onClick={onSelect}
			onKeyDown={event => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault()
					onSelect()
				}
			}}
		>
			<CardContent className="h-full p-2">
				<div className="flex h-full flex-col justify-between gap-1">
					<div className="flex items-start justify-between gap-1">
						<h4 className="type-panel line-clamp-2 break-words text-foreground">
							{name}
						</h4>
						<Badge variant="outline" className="shrink-0">
							{t('dayCountBadge', { days: dayCount })}
						</Badge>
					</div>
					<p className="type-body-sm line-clamp-2 text-ink-3">{description}</p>
				</div>
			</CardContent>
		</Card>
	)
}
