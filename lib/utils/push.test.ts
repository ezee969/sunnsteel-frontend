import { describe, expect, it } from 'vitest'

import {
	describeDevice,
	isIosDevice,
	type PushEnvironment,
	resolvePushStatus,
	urlBase64ToUint8Array,
} from './push'

const IPHONE =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
const IPADOS =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
const ANDROID_CHROME =
	'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36'
const WINDOWS_EDGE =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0'

const env = (overrides: Partial<PushEnvironment> = {}): PushEnvironment => ({
	supported: true,
	permission: 'default',
	isSubscribed: false,
	vapidPublicKey: 'BKey',
	isStandalone: true,
	isIos: false,
	...overrides,
})

describe('VAPID key decoding', () => {
	it('restores the padding base64url dropped', () => {
		// "hi" is "aGk=" in base64; base64url sends it unpadded.
		expect(Array.from(urlBase64ToUint8Array('aGk'))).toEqual([104, 105])
	})

	it('maps the url-safe alphabet back before decoding', () => {
		// 0xfb 0xff decodes from "+/8=" in base64 and "-_8" in base64url.
		expect(Array.from(urlBase64ToUint8Array('-_8'))).toEqual([251, 255])
	})

	it('produces a plain ArrayBuffer, which subscribe requires', () => {
		expect(urlBase64ToUint8Array('aGk').buffer).toBeInstanceOf(ArrayBuffer)
	})
})

describe('device labels', () => {
	it('names the platform and browser without keeping the user agent', () => {
		expect(describeDevice(ANDROID_CHROME)).toBe('Android · Chrome')
		expect(describeDevice(WINDOWS_EDGE)).toBe('Windows · Edge')
		expect(describeDevice(IPHONE)).toBe('iPhone · Safari')
	})

	it('falls back rather than inventing a device', () => {
		expect(describeDevice('some unknown client')).toBe('Device')
	})
})

describe('iOS detection', () => {
	it('recognises an iPhone', () => {
		expect(isIosDevice(IPHONE, 5)).toBe(true)
	})

	it('recognises an iPad claiming to be a Mac', () => {
		expect(isIosDevice(IPADOS, 5)).toBe(true)
	})

	it('leaves a real Mac alone', () => {
		expect(isIosDevice(IPADOS, 0)).toBe(false)
	})
})

describe('push availability (NOTIF-02)', () => {
	it('offers the prompt only when it can actually be honoured', () => {
		const status = resolvePushStatus(env())
		expect(status.availability).toBe('READY')
		expect(status.canEnable).toBe(true)
	})

	it('refuses to prompt in an iOS browser tab and says to install first', () => {
		const status = resolvePushStatus(env({ isIos: true, isStandalone: false }))
		expect(status.availability).toBe('REQUIRES_INSTALL')
		expect(status.canEnable).toBe(false)
		expect(status.description).toMatch(/home screen/i)
	})

	it('prompts on an installed iOS PWA', () => {
		expect(
			resolvePushStatus(env({ isIos: true, isStandalone: true })).canEnable,
		).toBe(true)
	})

	it('never prompts when the server holds no key', () => {
		const status = resolvePushStatus(env({ vapidPublicKey: null }))
		expect(status.availability).toBe('SERVER_UNAVAILABLE')
		expect(status.canEnable).toBe(false)
	})

	it('never re-prompts once the browser has refused', () => {
		const status = resolvePushStatus(env({ permission: 'denied' }))
		expect(status.availability).toBe('BLOCKED')
		expect(status.canEnable).toBe(false)
	})

	it('reports an unsupported browser instead of a broken button', () => {
		const status = resolvePushStatus(env({ supported: false }))
		expect(status.availability).toBe('UNSUPPORTED')
		expect(status.canEnable).toBe(false)
	})

	it('shows the enabled state only when permission and subscription agree', () => {
		expect(
			resolvePushStatus(env({ isSubscribed: true, permission: 'granted' }))
				.availability,
		).toBe('ENABLED')
		// A subscription the browser no longer permits is not enabled.
		expect(
			resolvePushStatus(env({ isSubscribed: true, permission: 'default' }))
				.availability,
		).toBe('READY')
	})

	it('puts the install requirement ahead of every other refusal', () => {
		// Otherwise an iOS tab with no server key would be told to fix the server.
		expect(
			resolvePushStatus(
				env({ isIos: true, isStandalone: false, vapidPublicKey: null }),
			).availability,
		).toBe('REQUIRES_INSTALL')
	})

	it('never promises a countdown anywhere in its copy', () => {
		const copy = (
			[
				env(),
				env({ isSubscribed: true, permission: 'granted' }),
				env({ isIos: true, isStandalone: false }),
			] as PushEnvironment[]
		)
			.map(resolvePushStatus)
			.map(status => `${status.title} ${status.description}`)
			.join(' ')

		expect(copy).not.toMatch(/countdown|counts down|ticking/i)
	})
})
