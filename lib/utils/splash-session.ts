/**
 * Whether the mobile splash has already played for this sign-in, in this tab.
 *
 * It used to be a module variable, so it only survived client-side routing:
 * every full document load played it again. Two such loads follow a deploy --
 * Next's router hard-navigates when the running build no longer matches the
 * server's, and the new service worker used to reload once more -- so a
 * sidebar click after a deploy replayed the splash twice before the page.
 *
 * `sessionStorage` survives reloads and hard navigations in the same tab and
 * starts empty in a new one, so a cold launch still gets its splash. A
 * signed-out state forgets it, so the next sign-in plays it again. The memory
 * flag covers a browser where storage throws (private modes, blocked site
 * data): there it degrades to the old once-per-document behaviour.
 */

export const SPLASH_SESSION_KEY = 'ss-splash-played'

export type SplashStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

let playedInMemory = false

export function getSplashStorage(): SplashStorage | null {
	try {
		return typeof window === 'undefined' ? null : window.sessionStorage
	} catch {
		return null
	}
}

export function hasSplashPlayed(storage: SplashStorage | null): boolean {
	if (playedInMemory) return true
	try {
		return storage?.getItem(SPLASH_SESSION_KEY) === '1'
	} catch {
		return false
	}
}

export function markSplashPlayed(storage: SplashStorage | null): void {
	playedInMemory = true
	try {
		storage?.setItem(SPLASH_SESSION_KEY, '1')
	} catch {
		// The memory flag still holds for this document.
	}
}

export function forgetSplash(storage: SplashStorage | null): void {
	playedInMemory = false
	try {
		storage?.removeItem(SPLASH_SESSION_KEY)
	} catch {
		// Nothing stored that could outlive the sign-out.
	}
}
