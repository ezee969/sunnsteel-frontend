import type { Event } from '@sentry/nextjs'
import { describe, expect, it } from 'vitest'

import { HttpError } from '@/lib/api/services/httpClient'

import { redactBreadcrumb, redactEvent, scrubUrl } from './redact'
import { shouldReport } from './report-error'
import {
	apiOrigin,
	browserSentryOptions,
	shouldTraceRequest,
	traceSampleRate,
} from './sentry-options'

describe('PLAT-02 what leaves the browser', () => {
	it('drops a share token, the query string and the fragment', () => {
		expect(scrubUrl('https://app.example/shared/sessions/AbC-123_x?x=1')).toBe(
			'https://app.example/shared/sessions/[token]',
		)
		expect(scrubUrl('/shared/routines/tok3n')).toBe('/shared/routines/[token]')
		expect(
			scrubUrl('https://app.example/auth/callback#access_token=eyJ.abc'),
		).toBe('https://app.example/auth/callback')
		expect(scrubUrl('/search?q=ana&type=members')).toBe('/search')
		expect(scrubUrl('/routines/42')).toBe('/routines/42')
	})

	it('keeps the language and the browser and nothing else of the request', () => {
		const event = redactEvent({
			request: {
				url: 'https://app.example/messages/new?to=ana',
				headers: {
					Referer: 'https://app.example/shared/sessions/secret',
					'User-Agent': 'Mozilla',
					'Accept-Language': 'es',
				},
				cookies: { ss_session: '1' },
				query_string: 'to=ana',
			},
			user: { id: 'user-1', email: 'ana@example.com', username: 'ana' },
		} as Event)

		expect(event.request).toEqual({
			url: 'https://app.example/messages/new',
			headers: { 'User-Agent': 'Mozilla', 'Accept-Language': 'es' },
		})
		expect(event.user).toEqual({ id: 'user-1' })
	})

	it('scrubs navigation and fetch breadcrumbs and drops console lines', () => {
		expect(redactBreadcrumb({ category: 'console', message: 'x' })).toBeNull()
		expect(
			redactBreadcrumb({
				category: 'navigation',
				data: { from: '/search?q=ana', to: '/shared/routines/abc' },
			}),
		).toEqual({
			category: 'navigation',
			data: { from: '/search', to: '/shared/routines/[token]' },
		})
		expect(
			redactBreadcrumb({
				category: 'fetch',
				data: { url: 'http://api/search?q=ana', method: 'GET' },
			}),
		).toEqual({
			category: 'fetch',
			data: { url: 'http://api/search', method: 'GET' },
		})
	})

	it('scrubs a page load and its request spans', () => {
		const event = redactEvent({
			type: 'transaction',
			transaction: '/shared/sessions/abc',
			spans: [
				{
					span_id: 'a',
					trace_id: 't',
					start_timestamp: 0,
					description: 'GET http://api/api/search?q=ana',
					data: {
						url: 'http://api/api/search?q=ana',
						'http.query': '?q=ana',
						'http.request.header.authorization': '[Filtered]',
						'net.peer.ip': '203.0.113.9',
					},
				},
			],
		} as unknown as Event)

		expect(event.transaction).toBe('/shared/sessions/[token]')
		expect(event.spans?.[0].description).toBe('GET http://api/api/search')
		expect(event.spans?.[0].data).toEqual({
			url: 'http://api/api/search',
			'net.peer.ip': '203.0.113.9',
		})
	})
})

describe('PLAT-02 browser configuration', () => {
	it('initialises nothing without a DSN', () => {
		expect(browserSentryOptions({})).toBeNull()
		expect(browserSentryOptions({ dsn: ' ' })).toBeNull()
	})

	it('sends trace headers only to our own API and no personal data', () => {
		const options = browserSentryOptions({
			dsn: 'https://key@o1.ingest.sentry.io/1',
			apiUrl: 'https://api.example/api',
			nodeEnv: 'production',
		})
		expect(options?.tracePropagationTargets).toEqual(['https://api.example'])
		expect(options?.sendDefaultPii).toBe(false)
		expect(options?.environment).toBe('production')
		expect(apiOrigin(undefined)).toBe('http://localhost:4000')
		expect(apiOrigin('not a url')).toBeNull()
	})

	it('samples every trace in development and a fifth in production', () => {
		expect(traceSampleRate({})).toBe(1)
		expect(traceSampleRate({ nodeEnv: 'production' })).toBe(0.2)
		expect(
			traceSampleRate({ nodeEnv: 'production', tracesSampleRate: '0.05' }),
		).toBe(0.05)
		expect(traceSampleRate({ tracesSampleRate: '-1' })).toBe(1)
	})

	it('never traces the realtime stream', () => {
		expect(shouldTraceRequest('http://api/api/realtime/stream')).toBe(false)
		expect(shouldTraceRequest('http://api/api/routines')).toBe(true)
	})

	it('reports what an error boundary caught unless the API refused', () => {
		expect(shouldReport(new HttpError('Not found', 404))).toBe(false)
		expect(shouldReport(new HttpError('Boom', 503))).toBe(true)
		expect(shouldReport(new Error('render failed'))).toBe(true)
		expect(shouldReport(null)).toBe(true)
	})
})
