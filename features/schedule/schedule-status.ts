import {
	CalendarClock,
	CheckCircle2,
	CircleDashed,
	CircleSlash,
	Moon,
	MoveRight,
	PlayCircle,
	SkipForward,
} from 'lucide-react'

/**
 * How each schedule state looks, shared by the week and month views and the
 * dashboard strip; its words come from `scheduleStatusLabel`. A status is a
 * glyph plus words, never colour alone (§4.3 rule 8). Only a completed
 * session uses `success` — it is the one thing done as planned. "Not logged"
 * is neutral on purpose: the app cannot know why a day passed.
 */
export const SCHEDULE_STATUS: Record<
	| 'COMPLETED'
	| 'ABORTED'
	| 'IN_PROGRESS'
	| 'PLANNED'
	| 'NOT_LOGGED'
	| 'REST'
	| 'MOVED'
	| 'SKIPPED',
	{ Icon: typeof CheckCircle2; tone: string }
> = {
	COMPLETED: { Icon: CheckCircle2, tone: 'text-success' },
	IN_PROGRESS: { Icon: PlayCircle, tone: 'text-ink-2' },
	ABORTED: { Icon: CircleSlash, tone: 'text-ink-3' },
	NOT_LOGGED: { Icon: CircleDashed, tone: 'text-ink-3' },
	PLANNED: { Icon: CalendarClock, tone: 'text-ink-3' },
	REST: { Icon: Moon, tone: 'text-ink-3' },
	// SCHED-04: the planned date of a workout moved elsewhere; neutral.
	MOVED: { Icon: MoveRight, tone: 'text-ink-3' },
	// SCHED-05: skipped on purpose — neutral, and never "not logged".
	SKIPPED: { Icon: SkipForward, tone: 'text-ink-3' },
}
