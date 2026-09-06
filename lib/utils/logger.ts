import { SHOULD_LOG_DEBUG } from '@/lib/config/env'

const isDebugEnabled = () => SHOULD_LOG_DEBUG

export const logger = {
	debug: (...args: unknown[]) => {
		if (isDebugEnabled()) {
			console.debug(...args)
		}
	},
	info: (...args: unknown[]) => {
		console.info(...args)
	},
	warn: (...args: unknown[]) => {
		console.warn(...args)
	},
	error: (...args: unknown[]) => {
		console.error(...args)
	},
}
