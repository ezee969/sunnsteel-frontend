export function getSharedProfilePath(username: string): string {
	return `/members/${encodeURIComponent(username)}`
}

export function getSharedProfileUrl(username: string, origin: string): string {
	return new URL(getSharedProfilePath(username), origin).toString()
}

export async function copyTextToClipboard(text: string): Promise<void> {
	if (navigator.clipboard?.writeText) {
		try {
			await Promise.race([
				navigator.clipboard.writeText(text),
				new Promise<never>((_, reject) => {
					setTimeout(() => reject(new Error('Clipboard write timed out')), 1000)
				}),
			])
			return
		} catch {}
	}

	const input = document.createElement('textarea')
	input.value = text
	input.setAttribute('readonly', '')
	input.style.position = 'fixed'
	input.style.opacity = '0'
	document.body.appendChild(input)
	input.select()
	const copied = document.execCommand('copy')
	input.remove()

	if (!copied) throw new Error('Clipboard write failed')
}
