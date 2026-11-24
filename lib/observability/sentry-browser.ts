import type * as SentryModule from '@sentry/nextjs'

import { isSitePath } from '@/lib/site/site-paths'

import { shouldTraceRequest } from './sentry-options'

/**
 * SITE-01: the browser SDK is a chunk of its own, fetched on demand. On the
 * app it starts as the page loads, with the page-load trace, as before. On
 * the public site it is fetched only when something goes wrong or the
 * visitor moves into the app, so reading the landing never runs it (it was
 * ~45 KB compressed of the script a phone ran before the hero painted).
 * Errors thrown before it arrives wait here and are sent once it has; after
 * that its own handlers take over.
 */

export type SentrySdk = typeof SentryModule

type NavigationType = 'push' | 'replace' | 'traverse'

export type SentrySetup = {
	options: SentryModule.BrowserOptions
	load: () => Promise<SentrySdk>
	/** Where early errors are heard: the window. */
	target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>
	pathname: () => string
}

let setup: SentrySetup | null = null
let ready: Promise<SentrySdk> | null = null
let sdk: SentrySdk | null = null
let tracing = false
const early: unknown[] = []

function hold(error: unknown) {
	if (sdk) return
	early.push(error)
	void startSentry()
}

function onError(event: Event) {
	const { error, message } = event as ErrorEvent
	hold(error ?? message)
}

function onRejection(event: Event) {
	hold((event as PromiseRejectionEvent).reason)
}

function tracingIntegration(sentry: SentrySdk, pageLoad: boolean) {
	return sentry.browserTracingIntegration({
		shouldCreateSpanForRequest: shouldTraceRequest,
		instrumentPageLoad: pageLoad,
	})
}

/**
 * Starts the SDK once and returns it. Tracing follows the page: the app is
 * traced, the site is not; a site visitor moving into the app gets
 * navigation tracing from then on.
 */
export function startSentry(pageLoad = false): Promise<SentrySdk> | null {
	if (!setup) return null
	const trace = !isSitePath(setup.pathname())
	if (!ready) {
		const { options, load, target } = setup
		tracing = trace
		ready = load().then(sentry => {
			sentry.init({
				...options,
				integrations: [
					...(trace ? [tracingIntegration(sentry, pageLoad)] : []),
					// Console lines can repeat anything the app logged.
					sentry.breadcrumbsIntegration({ console: false }),
				],
			})
			sdk = sentry
			target.removeEventListener('error', onError)
			target.removeEventListener('unhandledrejection', onRejection)
			for (const error of early.splice(0)) sentry.captureException(error)
			return sentry
		})
		return ready
	}
	if (trace && !tracing) {
		tracing = true
		void ready.then(sentry =>
			sentry.addIntegration(tracingIntegration(sentry, false)),
		)
	}
	return ready
}

/** Runs `use` once the SDK is there; nothing without a DSN. */
export function withSentry(use: (sentry: SentrySdk) => void): void {
	void startSentry()?.then(use)
}

/** Next's `onRouterTransitionStart`, for an SDK that may not be loaded. */
export function routerTransitionStart(
	href: string,
	navigationType: NavigationType,
): void {
	if (!setup) return
	sdk?.captureRouterTransitionStart(href, navigationType)
	if (!isSitePath(new URL(href, 'http://localhost').pathname))
		void startSentry()
}

/** Called once, from instrumentation-client.ts, before the app hydrates. */
export function configureSentry(next: SentrySetup): void {
	setup = next
	next.target.addEventListener('error', onError)
	next.target.addEventListener('unhandledrejection', onRejection)
	if (!isSitePath(next.pathname())) void startSentry(true)
}

/** Tests only: forget everything. */
export function resetSentryForTests(): void {
	setup = null
	ready = null
	sdk = null
	tracing = false
	early.length = 0
}
