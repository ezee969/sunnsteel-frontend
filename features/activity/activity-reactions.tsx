'use client'

import {
	ACTIVITY_REACTIONS,
	type ActivityReaction,
	type ActivityReactionSummary,
} from '@sunsteel/contracts'

import { ClassicalIcon } from '@/components/icons/ClassicalIcon'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSetActivityReaction } from '@/lib/api/hooks/useActivity'
import { cn } from '@/lib/utils'
import {
	ACTIVITY_REACTION_ICONS,
	ACTIVITY_REACTION_LABELS,
	describeReactionAction,
	reactionsGiven,
} from '@/lib/utils/activity'

/**
 * SOC-05. Four acknowledgements of one entry, never a score: the counts sit
 * beside the fact they belong to and nothing else reads them.
 *
 * The controls repeat on every entry, so they are never the primary action
 * (§4.3 rule 1) and carry no honour mark — a feed can hold many of them. The
 * viewer's own choice is a pressed state plus its accessible name, never
 * colour alone (§4.3 rule 8), and choosing it again removes it, which the
 * name says.
 */
export function ActivityReactions({
	entryId,
	summary,
	canReact,
}: {
	entryId: string
	summary: ActivityReactionSummary
	/** False on your own activity: there is nothing to acknowledge. */
	canReact: boolean
}) {
	const setReaction = useSetActivityReaction()
	const { push } = useToast()
	const given = reactionsGiven(summary)

	if (!canReact) {
		if (given.length === 0) return null
		return (
			<p className="type-body-sm mt-2 flex flex-wrap items-center gap-3 text-ink-3">
				{given.map(({ reaction, count }) => (
					<span key={reaction} className="flex items-center gap-1">
						<ClassicalIcon
							name={ACTIVITY_REACTION_ICONS[reaction]}
							className="size-4"
							aria-hidden
						/>
						<span className="type-data">{count}</span>
						<span className="sr-only">
							{ACTIVITY_REACTION_LABELS[reaction]}
						</span>
					</span>
				))}
			</p>
		)
	}

	const choose = (reaction: ActivityReaction) => {
		setReaction.mutate(
			{ entryId, reaction },
			{
				onError: error =>
					push({
						title: 'Reaction not saved',
						description: error.message,
						variant: 'destructive',
					}),
			},
		)
	}

	return (
		<div
			role="group"
			aria-label="Reactions"
			className="mt-2 flex flex-wrap items-center gap-1"
		>
			{ACTIVITY_REACTIONS.map(reaction => {
				const count = summary.counts[reaction]
				const chosen = summary.viewerReaction === reaction
				// An untouched reaction is offered without a count; one that
				// somebody gave shows how many, so a zero is never displayed.
				return (
					// The icons are a small closed set, so the name reaches a
					// pointer through a tooltip and assistive technology through
					// the accessible label. Neither is the only cue: the pressed
					// state and the count both move when one is chosen.
					<Tooltip key={reaction}>
						<TooltipTrigger asChild>
							<Button
								type="button"
								size="sm"
								variant={chosen ? 'secondary' : 'ghost'}
								aria-pressed={chosen}
								aria-label={describeReactionAction(reaction, summary)}
								disabled={setReaction.isPending}
								onClick={() => choose(reaction)}
							>
								<ClassicalIcon
									name={ACTIVITY_REACTION_ICONS[reaction]}
									className={cn(
										'size-4',
										chosen ? 'text-foreground' : 'text-ink-3',
									)}
									aria-hidden
								/>
								{count > 0 ? <span className="type-data">{count}</span> : null}
							</Button>
						</TooltipTrigger>
						<TooltipContent sideOffset={6}>
							{ACTIVITY_REACTION_LABELS[reaction]}
						</TooltipContent>
					</Tooltip>
				)
			})}
		</div>
	)
}
