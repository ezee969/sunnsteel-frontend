import type { Page } from '@playwright/test'

/**
 * next-themes is configured with attribute="class" and the default storage
 * key, so seeding localStorage before any app script runs gives a
 * deterministic theme with no flash. Emulating prefers-color-scheme alone
 * would not work: the dark variant is `&:is(.dark *)`, which keys off the
 * class, not the media query.
 */
export async function seedTheme(page: Page, theme: 'light' | 'dark') {
	await page.addInitScript(value => {
		try {
			window.localStorage.setItem('theme', value)
		} catch {
			// Private mode or blocked storage: fall through to the default theme
			// rather than failing the capture.
		}
	}, theme)
	await page.emulateMedia({ colorScheme: theme })
}
