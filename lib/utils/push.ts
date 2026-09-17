/**
 * NOTIF-02. Everything here is pure so the conditions under which push is and
 * is not available can be tested — they are the part most likely to be got
 * wrong, and getting them wrong means promising an alert that never arrives.
 */

/**
 * The VAPID key is served as base64url; `pushManager.subscribe` wants raw
 * bytes. Doing this by hand avoids pulling a dependency in for twelve lines.
 */
export function urlBase64ToUint8Array(
	base64UrlKey: string,
): Uint8Array<ArrayBuffer> {
	const padding = '='.repeat((4 - (base64UrlKey.length % 4)) % 4)
	const base64 = (base64UrlKey + padding).replace(/-/g, '+').replace(/_/g, '/')
	const raw = atob(base64)
	// Explicitly backed by a plain ArrayBuffer: `applicationServerKey` refuses a
	// view that might sit on a SharedArrayBuffer.
	const output = new Uint8Array(new ArrayBuffer(raw.length))
	for (let index = 0; index < raw.length; index += 1) {
		output[index] = raw.charCodeAt(index)
	}
	return output
}

/**
 * A short label so the owner can tell their phone from their laptop. It is
 * derived, never the raw user-agent string: the list is the owner's own, and
 * storing a full fingerprint to render six characters is not a trade worth
 * making.
 */
export function describeDevice(userAgent: string): string {
	const ua = userAgent.toLowerCase()
	const platform = ua.includes('ipad')
		? 'iPad'
		: ua.includes('iphone')
			? 'iPhone'
			: ua.includes('android')
				? 'Android'
				: ua.includes('mac os')
					? 'Mac'
					: ua.includes('windows')
						? 'Windows'
						: ua.includes('linux')
							? 'Linux'
							: 'Device'

	const browser = ua.includes('edg/')
		? 'Edge'
		: ua.includes('opr/') || ua.includes('opera')
			? 'Opera'
			: ua.includes('firefox')
				? 'Firefox'
				: ua.includes('chrome') || ua.includes('crios')
					? 'Chrome'
					: ua.includes('safari')
						? 'Safari'
						: null

	return browser ? `${platform} · ${browser}` : platform
}

export interface PushEnvironment {
	/** `serviceWorker`, `PushManager` and `Notification` all exist. */
	supported: boolean
	permission: NotificationPermission | null
	/** Whether this device already has a subscription registered on the server. */
	isSubscribed: boolean
	/** Null when the server holds no VAPID key pair. */
	vapidPublicKey: string | null
	/** Running from the Home Screen rather than a browser tab. */
	isStandalone: boolean
	isIos: boolean
}

export type PushAvailability =
	| 'READY'
	| 'ENABLED'
	| 'BLOCKED'
	| 'UNSUPPORTED'
	| 'SERVER_UNAVAILABLE'
	| 'REQUIRES_INSTALL'

export interface PushStatus {
	availability: PushAvailability
	/** Whether offering the permission prompt is honest here. */
	canEnable: boolean
	title: string
	description: string
}

/**
 * On iOS, Web Push works only in a PWA added to the Home Screen (16.4+) and
 * does nothing in a browser tab. Prompting there would consume the one
 * permission request the user gets and deliver nothing, so it is refused with
 * the reason stated instead.
 */
export function resolvePushStatus(env: PushEnvironment): PushStatus {
	if (!env.supported) {
		return {
			availability: 'UNSUPPORTED',
			canEnable: false,
			title: 'Not supported on this browser',
			description:
				'This browser cannot receive notifications. The in-app rest tone still works while the session screen is open.',
		}
	}

	if (env.isIos && !env.isStandalone) {
		return {
			availability: 'REQUIRES_INSTALL',
			canEnable: false,
			title: 'Add Sunnsteel to your Home Screen first',
			description:
				'On iPhone and iPad, notifications only reach an installed app. Share → Add to Home Screen, then open Sunnsteel from there.',
		}
	}

	if (!env.vapidPublicKey) {
		return {
			availability: 'SERVER_UNAVAILABLE',
			canEnable: false,
			title: 'Notifications are unavailable',
			description:
				'This server is not set up to send notifications yet. Nothing about your training is affected.',
		}
	}

	if (env.permission === 'denied') {
		return {
			availability: 'BLOCKED',
			canEnable: false,
			title: 'Notifications are blocked',
			description:
				'Your browser is refusing notifications for Sunnsteel. Allow them in its site settings, then come back.',
		}
	}

	if (env.isSubscribed && env.permission === 'granted') {
		return {
			availability: 'ENABLED',
			canEnable: false,
			title: 'This device receives alerts',
			description:
				'When rest ends while Sunnsteel is closed or your screen is locked, this device is notified.',
		}
	}

	return {
		availability: 'READY',
		canEnable: true,
		title: 'Get an alert when rest ends',
		description:
			'The in-app tone cannot play once your screen locks. A notification can, and it names the lift that is up next.',
	}
}

/** True for an iOS device, including iPadOS reporting itself as a Mac. */
export function isIosDevice(
	userAgent: string,
	maxTouchPoints: number,
): boolean {
	const ua = userAgent.toLowerCase()
	if (/iphone|ipad|ipod/.test(ua)) return true
	// iPadOS 13+ claims to be a Mac; the touch points give it away.
	return ua.includes('mac os') && maxTouchPoints > 1
}
