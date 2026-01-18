// Unified routine type definitions shared across wizard + API layer.
// Source of truth aligns with backend Prisma enums (see backend prisma/schema.prisma).

export {
	PROGRESSION_SCHEMES,
	REP_TYPES,
} from '@sunsteel/contracts'

export type {
	ProgressionScheme,
	RepType,
} from '@sunsteel/contracts'

// Note: PROGRAMMED_RTF_HYPERTROPHY is now available as a separate progression scheme
// This allows per-exercise choice between Standard RTF and Hypertrophy RTF variants
