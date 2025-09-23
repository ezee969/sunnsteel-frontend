// Unified routine type definitions shared across wizard + API layer.
// Source of truth aligns with backend Prisma enums (see backend prisma/schema.prisma).

export type RepType = 'FIXED' | 'RANGE'
export const REP_TYPES: RepType[] = ['FIXED', 'RANGE']

export type ProgressionScheme =
	| 'NONE'
	| 'DOUBLE_PROGRESSION'
	| 'DYNAMIC_DOUBLE_PROGRESSION'
	| 'PROGRAMMED_RTF'

export const PROGRESSION_SCHEMES: ProgressionScheme[] = [
	'NONE',
	'DOUBLE_PROGRESSION',
	'DYNAMIC_DOUBLE_PROGRESSION',
	'PROGRAMMED_RTF',
]

// Deprecated: 'PROGRAMMED_RTF_HYPERTROPHY' was experimental and removed.
// Reintroduce only after backend enum support + migration.
