'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TrainingSplit } from '../constants/training-days'

interface CommonSplitCardProps {
	readonly split: TrainingSplit
	readonly isSelected: boolean
	readonly isMobile: boolean
	readonly onSelect: () => void
}

export const CommonSplitCard = ({
	split,
	isSelected,
	isMobile,
	onSelect,
}: CommonSplitCardProps) => (
	<Card
		className={cn(
			'cursor-pointer transition-all hover:bg-muted/50 active:scale-[0.98]',
			'border-border/50',
			'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
			isSelected && 'ring-1 ring-primary bg-muted/30',
			isMobile ? 'h-16' : 'h-20',
		)}
		role="button"
		tabIndex={0}
		aria-label={`Select ${split.name} training split (${split.days.length} days)`}
		onClick={onSelect}
		onKeyDown={(event) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault()
				onSelect()
			}
		}}
	>
		<CardContent className="p-1.5 md:p-2 h-full">
			<div className="flex flex-col h-full justify-between">
				<div className="flex justify-between items-start gap-1">
					<h4 className="font-medium text-xs md:text-sm truncate">{split.name}</h4>
					<Badge variant="outline" className="shrink-0 text-[10px] md:text-xs h-5 px-1.5">
						{split.days.length}d
					</Badge>
				</div>
				<p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
					{split.description}
				</p>
			</div>
		</CardContent>
	</Card>
)
