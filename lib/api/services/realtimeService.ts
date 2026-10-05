import { REALTIME_STREAM_PATH } from '@sunsteel/contracts'

import { openAuthorizedStream } from './httpClient'

/** MSG-06: the signed-in member's change signals (Server-Sent Events). */
export const realtimeService = {
	openStream: (signal: AbortSignal) =>
		openAuthorizedStream(REALTIME_STREAM_PATH, signal),
}
