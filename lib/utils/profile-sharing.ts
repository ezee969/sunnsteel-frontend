export function getSharedProfilePath(username: string): string {
	return `/members/${encodeURIComponent(username)}`
}

export function getSharedProfileUrl(username: string, origin: string): string {
	return new URL(getSharedProfilePath(username), origin).toString()
}
