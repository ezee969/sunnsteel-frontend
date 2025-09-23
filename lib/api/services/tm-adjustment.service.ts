import { httpClient } from './httpClient'
import {
	CreateTmEventRequest,
	TmEventResponse,
	TmEventSummary,
	GetTmAdjustmentsParams,
} from '../types/tm-adjustment.types'

/**
 * TM Adjustment API Service
 * 
 * Provides HTTP client methods for interacting with Training Max adjustment
 * endpoints in PROGRAMMED_RTF routines.
 */
export class TmAdjustmentService {
	/**
	 * Create a new TM adjustment for a routine
	 */
	static async createTmAdjustment(
		routineId: string,
		data: CreateTmEventRequest
	): Promise<TmEventResponse> {
		return httpClient.request<TmEventResponse>(
			`/routines/${routineId}/tm-events`,
			{
				method: 'POST',
				body: JSON.stringify(data),
				secure: true,
			}
		)
	}

	/**
	 * Get TM adjustments for a routine with optional filtering
	 */
	static async getTmAdjustments(
		routineId: string,
		params?: GetTmAdjustmentsParams
	): Promise<TmEventResponse[]> {
		const searchParams = new URLSearchParams()
		
		if (params?.exerciseId) {
			searchParams.append('exerciseId', params.exerciseId)
		}
		if (params?.minWeek !== undefined) {
			searchParams.append('minWeek', params.minWeek.toString())
		}
		if (params?.maxWeek !== undefined) {
			searchParams.append('maxWeek', params.maxWeek.toString())
		}

		const queryString = searchParams.toString()
		const url = `/routines/${routineId}/tm-events${queryString ? `?${queryString}` : ''}`

		return httpClient.request<TmEventResponse[]>(url, {
			method: 'GET',
			secure: true,
		})
	}

	/**
	 * Get summary statistics for TM adjustments in a routine
	 */
	static async getTmAdjustmentSummary(routineId: string): Promise<TmEventSummary[]> {
		return httpClient.request<TmEventSummary[]>(
			`/routines/${routineId}/tm-events/summary`,
			{
				method: 'GET',
				secure: true,
			}
		)
	}
}