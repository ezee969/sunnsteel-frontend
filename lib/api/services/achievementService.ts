import type { AchievementsResponse } from '@sunsteel/contracts'

import { httpClient } from './httpClient'

export const achievementService = {
	list: (): Promise<AchievementsResponse> =>
		httpClient.get<AchievementsResponse>('/achievements', true),
}
