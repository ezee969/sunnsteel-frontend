const SUNNSTEEL_CACHE_PREFIX = 'ss-'
const ACTIVE_WORKOUT_SESSION_PREFIX = '/workouts/sessions/'

export const isSunnsteelCacheName = (cacheName: string): boolean =>
	cacheName.startsWith(SUNNSTEEL_CACHE_PREFIX)

export const shouldDeferServiceWorkerUpdate = (pathname: string): boolean =>
	pathname.startsWith(ACTIVE_WORKOUT_SESSION_PREFIX)
