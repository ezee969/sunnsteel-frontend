import {
	CalendarClock,
	CheckCircle2,
	CircleDashed,
	CircleSlash,
	Moon,
	PlayCircle,
} from 'lucide-react'

/**
 * How each schedule state reads, shared by the week and month views. A status
 * is a glyph plus words, never colour alone (§4.3 rule 8). Only a completed
 * session uses `success` — it is the one thing done as planned. "Not logged"
 * is neutral on purpose: the app cannot know why a day passed.
 */
export const SCHEDULE_STATUS: Record<
	'COMPLETED' | 'ABORTED' | 'IN_PROGRESS' | 'PLANNED' | 'NOT_LOGGED' | 'REST',
	{ Icon: typeof CheckCircle2; label: string; tone: string }
> = {
	COMPLETED: { Icon: CheckCircle2, label: 'Completed', tone: 'text-success' },
	IN_PROGRESS: { Icon: PlayCircle, label: 'In progress', tone: 'text-ink-2' },
	ABORTED: { Icon: CircleSlash, label: 'Ended early', tone: 'text-ink-3' },
	NOT_LOGGED: { Icon: CircleDashed, label: 'Not logged', tone: 'text-ink-3' },
	PLANNED: { Icon: CalendarClock, label: 'Planned', tone: 'text-ink-3' },
	REST: { Icon: Moon, label: 'Rest day', tone: 'text-ink-3' },
}
