'use client'

import { ArrowLeft, Check, Edit, Heart } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Routine } from '@/lib/api/types/routine.type'

interface RoutineHeaderProps {
	routine: Routine
	daysPerWeek: number
	onBack: () => void
	onEdit: () => void
	onToggleFavorite: () => void
	onToggleCompleted: () => void
	isToggling: boolean
}

/**
 * The routine detail page's masthead (§11.11), on the history detail page's
 * pattern: back control, the inscription with its one pair of corner brackets,
 * the schedule as a plain caption, then the routine's actions — all over the
 * page's one double rule. It was a stack under a `container`, with the schedule
 * in a boxed badge (TD-38).
 */
export const RoutineHeader = ({
	routine,
	daysPerWeek,
	onBack,
	onEdit,
	onToggleFavorite,
	onToggleCompleted,
	isToggling,
}: RoutineHeaderProps) => {
	return (
		<header className="rule-heading pb-4">
			<div className="flex items-start gap-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={onBack}
					aria-label="Back to Routines"
					className="-ml-2 size-11 shrink-0 rounded-sm p-2 text-ink-2 hover:bg-muted hover:text-foreground md:size-9"
				>
					<ArrowLeft className="h-4 w-4" aria-hidden />
				</Button>
				<div className="min-w-0 pt-1.5 md:pt-0.5">
					{/* Wraps rather than truncating (§11.11). */}
					<h1 className="type-page corner-brackets inline-block text-foreground">
						{routine.name}
					</h1>
					<p className="type-body-sm mt-1 text-ink-3">
						{daysPerWeek} {daysPerWeek === 1 ? 'day' : 'days'} per week
					</p>
					{routine.description && (
						<p className="mt-2 max-w-[68ch] text-sm text-ink-2 sm:text-base">
							{routine.description}
						</p>
					)}
				</div>
			</div>

			{/* TD-35: the row wraps. Unwrapped, the three labelled actions pushed
			    <main> to 551px at 320 and 563px at 768, where the shell leaves this
			    column 512px (viewport - 256). */}
			<div className="mt-4 flex flex-wrap items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={onToggleFavorite}
					disabled={isToggling}
				>
					<Heart
						className={`h-4 w-4 mr-2 ${routine.isFavorite ? 'fill-current text-foreground' : ''}`}
					/>
					{routine.isFavorite ? 'Unfavorite' : 'Favorite'}
				</Button>

				<Button
					variant="outline"
					size="sm"
					onClick={onToggleCompleted}
					disabled={isToggling}
				>
					<Check
						className={`h-4 w-4 mr-2 ${routine.isCompleted ? 'fill-current text-success' : ''}`}
					/>
					{routine.isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
				</Button>

				<Button variant="outline" size="sm" onClick={onEdit}>
					<Edit className="h-4 w-4 mr-2" />
					Edit
				</Button>
			</div>
		</header>
	)
}
