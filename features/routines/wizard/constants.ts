export const PROGRAM_SCHEDULE_TOOLTIP =
	"Choose 'Timeframe' for programs that have a calendar start/end. Otherwise choose 'None' for open-ended routines."

export const PROGRAM_START_TOOLTIP =
	'Select when your program begins. The timezone will be automatically detected based on your current location.'

export const PROGRAM_SCHEDULE_OPTIONS = [
	{
		value: 'NONE',
		label: 'None (indefinite)',
	},
	{
		value: 'TIMEFRAME',
		label: 'Timeframe (date-driven)',
	},
] as const

export type ProgramScheduleOption = (typeof PROGRAM_SCHEDULE_OPTIONS)[number]
