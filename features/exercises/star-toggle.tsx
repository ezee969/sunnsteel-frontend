'use client'

import { Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	useStarredExercises,
	useToggleExerciseStar,
} from '@/lib/api/hooks/useExercises'
import { cn } from '@/lib/utils'

/**
 * EXER-07: a private star on one exercise. The filled glyph and `aria-pressed`
 * carry the state (colour never does alone, §4.3 rule 8); it is ink, not
 * honour, because a star is a preference rather than an achievement. It stays
 * disabled until the owner's stars are known.
 */
export function StarToggle({
	exerciseId,
	exerciseName,
	showLabel = false,
	className,
}: {
	exerciseId: string
	exerciseName: string
	showLabel?: boolean
	className?: string
}) {
	const stars = useStarredExercises()
	const toggle = useToggleExerciseStar()
	const starred = Boolean(
		stars.data?.items.some(item => item.exerciseId === exerciseId),
	)
	const label = `${starred ? 'Unstar' : 'Star'} ${exerciseName}`

	return (
		<Button
			type="button"
			variant="ghost"
			size={showLabel ? 'sm' : 'icon'}
			aria-pressed={starred}
			aria-label={showLabel ? undefined : label}
			title={label}
			disabled={!stars.data}
			onClick={() => toggle.mutate({ exerciseId, starred: !starred })}
			className={cn(!showLabel && 'size-10 shrink-0', className)}
		>
			<Star
				aria-hidden
				className={cn(
					'size-4',
					starred ? 'fill-current text-foreground' : 'text-ink-3',
				)}
			/>
			{showLabel ? (starred ? 'Starred' : 'Star') : null}
		</Button>
	)
}
