/**
 * Training Max (TM) Adjustment Types
 * 
 * These types align with the backend DTOs for TM adjustment functionality
 * in PROGRAMMED_RTF routines.
 */

/**
 * Request payload for creating a TM adjustment
 */
export interface CreateTmEventRequest {
	exerciseId: string
	weekNumber: number
	deltaKg: number
	preTmKg: number
	postTmKg: number
	reason?: string
}

/**
 * Response format for TM adjustment events
 */
export interface TmEventResponse {
	id: string
	routineId: string
	exerciseId: string
	exerciseName: string
	weekNumber: number
	deltaKg: number
	preTmKg: number
	postTmKg: number
	reason?: string
	style: 'STANDARD' | 'HYPERTROPHY' | null
	createdAt: string
}

/**
 * Summary statistics for TM adjustments per exercise
 */
export interface TmEventSummary {
	exerciseId: string
	exerciseName: string
	totalDeltaKg: number
	averageDeltaKg: number
	adjustmentCount: number
	lastAdjustmentDate: string | null
}

/**
 * Query parameters for fetching TM adjustments
 */
export interface GetTmAdjustmentsParams {
	exerciseId?: string
	minWeek?: number
	maxWeek?: number
}

/**
 * Program Style enum for RTF routines
 */
export type ProgramStyle = 'STANDARD' | 'HYPERTROPHY'

/**
 * TM Adjustment validation constants
 */
export const TM_ADJUSTMENT_CONSTANTS = {
	MAX_DELTA_KG: 15, // Warning threshold for large adjustments
	MIN_DELTA_KG: -15, // Minimum allowed delta
	MIN_WEEK: 1,
	MAX_WEEK: 21,
	MAX_REASON_LENGTH: 160
} as const