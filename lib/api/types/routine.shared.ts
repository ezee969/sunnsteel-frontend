// Unified routine type definitions shared across wizard + API layer.
// Source of truth aligns with backend Prisma enums (see backend prisma/schema.prisma).

export type RepType = 'FIXED' | 'RANGE'
export const REP_TYPES: RepType[] = ['FIXED', 'RANGE']

export type ProgressionScheme =
	| 'NONE'
	| 'DOUBLE_PROGRESSION'
	| 'DYNAMIC_DOUBLE_PROGRESSION'
	| 'PROGRAMMED_RTF'
	| 'PROGRAMMED_RTF_HYPERTROPHY'

export const PROGRESSION_SCHEMES: ProgressionScheme[] = [
	'NONE',
	'DOUBLE_PROGRESSION',
	'DYNAMIC_DOUBLE_PROGRESSION',
	'PROGRAMMED_RTF',
	'PROGRAMMED_RTF_HYPERTROPHY',
]

// Note: PROGRAMMED_RTF_HYPERTROPHY is now available as a separate progression scheme
// This allows per-exercise choice between Standard RTF and Hypertrophy RTF variants
