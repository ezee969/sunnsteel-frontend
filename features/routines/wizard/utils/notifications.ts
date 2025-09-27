const isBrowser = typeof window !== 'undefined'

export const notifyInfo = (message: string) => {
	if (!isBrowser) {
		return
	}

	window.alert(message)
}
