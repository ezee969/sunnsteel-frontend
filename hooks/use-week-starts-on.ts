import {
	DEFAULT_WEEK_STARTS_ON,
	isWeekStartsOn,
	type WeekStartsOn,
} from '@sunsteel/contracts'

import { useUser } from '@/lib/api/hooks/useUser'

/**
 * PREF-04: the weekday the member's weeks start on, from their profile;
 * Monday until it has loaded or when it was never chosen.
 */
export function useWeekStartsOn(): WeekStartsOn {
	const { user } = useUser()
	const value = user?.weekStartsOn
	return isWeekStartsOn(value) ? value : DEFAULT_WEEK_STARTS_ON
}
