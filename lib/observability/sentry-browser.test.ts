import { afterEach, describe, expect, it, vi } from 'vitest'

import {
	configureSentry,
	resetSentryForTests,
	routerTransitionStart,
	type SentrySdk,
	withSentry,
} from './sentry-browser'

function fakeSdk() {
	return {
		init: vi.fn(),
		captureException: vi.fn(),
		setUser: vi.fn(),
		addIntegration: vi.fn(),
		captureRouterTransitionStart: vi.fn(),
		breadcrumbsIntegration: vi.fn((options: object) => ({
			name: 'Breadcrumbs',
			options,
		})),
		browserTracingIntegration: vi.fn((options: object) => ({
			name: 'BrowserTracing',
			options,
		})),
	}
}

function setUp(path: string) {
	const sdk = fakeSdk()
	const load = vi.fn(async () => sdk as unknown as SentrySdk)
	const target = new EventTarget()
	let pathname = path
	configureSentry({
		options: { dsn: 'https://key@example.ingest.sentry.io/1' },
		load,
		target,
		pathname: () => pathname,
	})
	return {
		sdk,
		load,
		target,
		moveTo: (next: string) => {
			pathname = next
		},
	}
}

const settle = () => new Promise(resolve => setTimeout(resolve, 0))

function integrationNames(sdk: ReturnType<typeof fakeSdk>) {
	const [options] = sdk.init.mock.calls[0] as [
		{ integrations: { name: string }[] },
	]
	return options.integrations.map(integration => integration.name)
}

afterEach(() => resetSentryForTests())

describe('the browser SDK on demand (SITE-01)', () => {
	it('starts at once on the app, with the page-load trace', async () => {
		const { sdk, load } = setUp('/dashboard')
		await settle()
		expect(load).toHaveBeenCalledTimes(1)
		expect(integrationNames(sdk)).toEqual(['BrowserTracing', 'Breadcrumbs'])
		expect(sdk.browserTracingIntegration).toHaveBeenCalledWith(
			expect.objectContaining({ instrumentPageLoad: true }),
		)
	})

	it('loads nothing on the public site until something goes wrong', async () => {
		const { sdk, load, target } = setUp('/')
		await settle()
		expect(load).not.toHaveBeenCalled()

		const boom = new Error('boom')
		target.dispatchEvent(Object.assign(new Event('error'), { error: boom }))
		target.dispatchEvent(
			Object.assign(new Event('unhandledrejection'), { reason: 'later' }),
		)
		await settle()

		expect(load).toHaveBeenCalledTimes(1)
		expect(integrationNames(sdk)).toEqual(['Breadcrumbs'])
		expect(sdk.captureException.mock.calls).toEqual([[boom], ['later']])

		// Its own handlers have it from here: nothing is held twice.
		target.dispatchEvent(Object.assign(new Event('error'), { error: boom }))
		await settle()
		expect(sdk.captureException).toHaveBeenCalledTimes(2)
	})

	it('reports a boundary error from the site once loaded', async () => {
		const { sdk, load } = setUp('/pricing')
		const boom = new Error('render failed')
		withSentry(sentry => sentry.captureException(boom))
		await settle()
		expect(load).toHaveBeenCalledTimes(1)
		expect(sdk.captureException).toHaveBeenCalledWith(boom)
	})

	it('starts when a site visitor moves into the app, tracing from then on', async () => {
		const { sdk, load, moveTo } = setUp('/features')
		routerTransitionStart('/pricing', 'push')
		await settle()
		expect(load).not.toHaveBeenCalled()

		moveTo('/pricing')
		routerTransitionStart('/login', 'push')
		await settle()
		expect(load).toHaveBeenCalledTimes(1)
		expect(integrationNames(sdk)).toEqual(['Breadcrumbs'])

		moveTo('/login')
		routerTransitionStart('/signup', 'push')
		await settle()
		expect(sdk.addIntegration).toHaveBeenCalledTimes(1)
		expect(sdk.browserTracingIntegration).toHaveBeenCalledWith(
			expect.objectContaining({ instrumentPageLoad: false }),
		)
		expect(sdk.captureRouterTransitionStart).toHaveBeenCalledWith(
			'/signup',
			'push',
		)

		routerTransitionStart('/dashboard', 'push')
		await settle()
		expect(sdk.addIntegration).toHaveBeenCalledTimes(1)
	})

	it('does nothing without a DSN', async () => {
		const use = vi.fn()
		withSentry(use)
		routerTransitionStart('/dashboard', 'push')
		await settle()
		expect(use).not.toHaveBeenCalled()
	})
})
