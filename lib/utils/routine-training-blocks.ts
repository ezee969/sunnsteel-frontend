import type {
	RoutineTrainingBlockSource,
	RoutineTrainingBlockState,
} from '@sunsteel/contracts'

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
	timeZone: 'UTC',
})

function parseCalendarDate(date: string) {
	return new Date(`${date}T12:00:00Z`)
}

export function formatTrainingBlockRange(startDate: string, endDate: string) {
	return `${DATE_FORMAT.format(parseCalendarDate(startDate))} – ${DATE_FORMAT.format(parseCalendarDate(endDate))}`
}

export function trainingBlockStateLabel(state: RoutineTrainingBlockState) {
	return {
		FUTURE: 'Upcoming',
		ACTIVE: 'In progress',
		COMPLETE: 'Complete',
	}[state]
}

export function describeTrainingBlockSource(
	source: RoutineTrainingBlockSource,
) {
	if (source.kind === 'CURRENT_ROUTINE')
		return 'Based on the routine at creation'
	const title = source.versionName?.trim() || `Version ${source.versionNumber}`
	return `Based on ${title}`
}

export function trainingBlockChangeNote(state: RoutineTrainingBlockState) {
	if (state === 'COMPLETE') return 'Completed blocks are read-only.'
	if (state === 'ACTIVE') {
		return 'Changing it creates a new revision; its start date stays fixed.'
	}
	return 'Changing it creates a new revision without changing the routine.'
}

/**
 * ROUT-15: the line a routine page shows while a block is in force, naming
 * what the days below are and when the routine's own days return.
 */
export function describeBlockInForce(block: {
	name: string
	endDate: string
}): string {
	const [year, month, day] = block.endDate.split('-').map(Number)
	const resume = new Date(Date.UTC(year, month - 1, day + 1, 12))
	return `Training block “${block.name}” is in force until ${DATE_FORMAT.format(parseCalendarDate(block.endDate))}, so these are its days. The routine's own days return on ${DATE_FORMAT.format(resume)}.`
}
