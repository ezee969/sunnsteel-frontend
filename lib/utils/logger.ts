const isDebugEnabled = () =>
	process.env.NODE_ENV === 'development' ||
	process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS === 'true'

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
