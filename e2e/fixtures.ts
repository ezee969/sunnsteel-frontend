import { type BrowserContext, test as base } from '@playwright/test'

/**
 * `captureDir` selects which screenshot set a run writes to. It is a Playwright
 * project option rather than an environment variable on purpose: `VAR=x cmd`
 * does not work in cmd.exe, and this repo runs on Windows.
 *
 *   npm run ui:capture:before   ->  --project=before
 *   npm run ui:capture:after    ->  --project=after
 */
export type CaptureOptions = {
	captureDir: 'before' | 'after'
}

/**
 * MSG-06: answers the realtime stream with an empty one, so a signed-in page
 * keeps polling exactly as it did before the stream existed. A live stream is
 * a request that never finishes, and every `networkidle` wait in these suites
 * would time out behind it. Call it on every context that carries the saved
 * sign-in; the `context` fixture below does it for the tests' own.
 */
export async function muteRealtimeStream(context: BrowserContext) {
	await context.route('**/api/realtime/stream', route =>
		route.fulfill({ status: 200, contentType: 'text/event-stream', body: '' }),
	)
}

export const test = base.extend<CaptureOptions>({
	captureDir: ['before', { option: true }],
	context: async ({ context }, provide) => {
		await muteRealtimeStream(context)
		await provide(context)
	},
})

export { expect } from '@playwright/test'
