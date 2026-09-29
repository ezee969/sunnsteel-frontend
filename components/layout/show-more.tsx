'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { showMoreLabel, visibleRows } from '@/lib/utils/long-content'

/**
 * Design system §20.2: the first `limit` rows of a list inside a page that
 * scrolls, then a control naming how many more there are. The page keeps one
 * scroll; there is never a scroll box inside it.
 */
export function useShowMore<T>(items: readonly T[], limit: number) {
	const t = useTranslations('core.common')
	const [expanded, setExpanded] = useState(false)
	return {
		visible: visibleRows(items, limit, expanded),
		label: showMoreLabel(items.length, limit, expanded, t),
		expanded,
		toggle: () => setExpanded(current => !current),
	}
}

interface ShowMoreButtonProps {
	/** From `useShowMore`; nothing renders when every row already fits. */
	label: string | null
	expanded: boolean
	onToggle: () => void
	/** The id of the list it reveals rows of. */
	controls: string
}

/** A ghost control, because it repeats under lists and is never primary. */
export function ShowMoreButton({
	label,
	expanded,
	onToggle,
	controls,
}: ShowMoreButtonProps) {
	if (!label) return null
	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			aria-expanded={expanded}
			aria-controls={controls}
			onClick={onToggle}
			className="mt-2 h-11 sm:h-9"
		>
			{label}
		</Button>
	)
}
