import type {
	CreateTrainingReviewRequest,
	TrainingReviewResult,
	TrainingReviewUsage,
} from '@sunsteel/contracts'

import { httpClient } from './httpClient'

/** INTEL-04: a Pro member's monthly reviews and the writing of one. */
export const trainingReviewService = {
	usage: (): Promise<TrainingReviewUsage> =>
		httpClient.get<TrainingReviewUsage>('/training-reviews/usage', true),
	create: (body: CreateTrainingReviewRequest): Promise<TrainingReviewResult> =>
		httpClient.post<TrainingReviewResult>('/training-reviews', body, true),
}
