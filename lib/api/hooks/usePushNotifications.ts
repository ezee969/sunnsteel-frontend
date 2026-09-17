'use client'

import type { PushSubscriptionsResponse } from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'

import {
	describeDevice,
	isIosDevice,
	type PushStatus,
	resolvePushStatus,
	urlBase64ToUint8Array,
} from '@/lib/utils/push'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

import { pushService } from '../services/pushService'

export const pushKeys = {
	subscriptions: ['notifications', 'push', 'subscriptions'] as const,
}

const hasPushSupport = () =>
	typeof window !== 'undefined' &&
	'serviceWorker' in navigator &&
	'PushManager' in window &&
	'Notification' in window

/**
 * NOTIF-02. The server is the only place that knows the VAPID key, so the
 * subscription list doubles as the availability check — one read answers both
 * "can this app push at all" and "does this device already receive them".
 */
export function usePushSubscriptions() {
	const { session, isLoading } = useSupabaseAuth()
	return useQuery<PushSubscriptionsResponse>({
		queryKey: pushKeys.subscriptions,
		queryFn: pushService.getSubscriptions,
		enabled: !isLoading && Boolean(session),
	})
}

/** The browser's current subscription endpoint, or null. */
async function readEndpoint(): Promise<string | null> {
	if (!hasPushSupport()) return null
	const registration = await navigator.serviceWorker.getRegistration()
	const subscription = await registration?.pushManager.getSubscription()
	return subscription?.endpoint ?? null
}

export interface PushControls extends PushStatus {
	isPending: boolean
	enable: () => Promise<void>
	disable: () => Promise<void>
	/** Set when the last attempt failed for a reason worth showing. */
	error: string | null
}

/**
 * Everything the Settings surface needs: the honest availability state, and
 * the two actions. The permission prompt is only ever raised from `enable`,
 * which a user has to click — a prompt on load is the fastest way to get
 * permanently blocked.
 */
export function usePushNotifications(): PushControls {
	const queryClient = useQueryClient()
	const { data } = usePushSubscriptions()
	const [endpoint, setEndpoint] = useState<string | null>(null)
	const [permission, setPermission] = useState<NotificationPermission | null>(
		null,
	)
	const [error, setError] = useState<string | null>(null)

	const refreshDeviceState = useCallback(async () => {
		if (!hasPushSupport()) return
		setPermission(Notification.permission)
		setEndpoint(await readEndpoint())
	}, [])

	useEffect(() => {
		void refreshDeviceState()
	}, [refreshDeviceState])

	// The browser can rotate a subscription at any time; the worker forwards
	// that to whichever page is open so the server learns the new endpoint.
	useEffect(() => {
		if (!hasPushSupport()) return
		const onMessage = (event: MessageEvent) => {
			if (event.data?.type === 'PUSH_SUBSCRIPTION_CHANGED') {
				void refreshDeviceState()
				void queryClient.invalidateQueries({ queryKey: pushKeys.subscriptions })
			}
		}
		navigator.serviceWorker.addEventListener('message', onMessage)
		return () =>
			navigator.serviceWorker.removeEventListener('message', onMessage)
	}, [queryClient, refreshDeviceState])

	const enable = useMutation({
		mutationFn: async () => {
			const vapidPublicKey = data?.vapidPublicKey
			if (!vapidPublicKey) throw new Error('Push is unavailable on this server')

			const result = await Notification.requestPermission()
			setPermission(result)
			if (result !== 'granted') {
				throw new Error(
					result === 'denied'
						? 'Your browser refused notifications for Sunnsteel.'
						: 'Notifications were not enabled.',
				)
			}

			const registration = await navigator.serviceWorker.ready
			const subscription =
				(await registration.pushManager.getSubscription()) ??
				(await registration.pushManager.subscribe({
					// Browsers only accept a subscription that will always show a
					// notification, which is exactly what a rest alert does.
					userVisibleOnly: true,
					applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
				}))

			const json = subscription.toJSON()
			return pushService.register({
				endpoint: subscription.endpoint,
				expirationTime: subscription.expirationTime ?? null,
				keys: {
					p256dh: json.keys?.p256dh ?? '',
					auth: json.keys?.auth ?? '',
				},
				deviceLabel: describeDevice(navigator.userAgent),
			})
		},
		onSuccess: response => {
			queryClient.setQueryData(pushKeys.subscriptions, response)
			void refreshDeviceState()
			setError(null)
		},
		onError: (mutationError: Error) => setError(mutationError.message),
	})

	const disable = useMutation({
		mutationFn: async () => {
			const registration = await navigator.serviceWorker.getRegistration()
			const subscription = await registration?.pushManager.getSubscription()
			const current = subscription?.endpoint ?? endpoint
			// Unsubscribe locally first: a device that still holds a subscription
			// the server forgot would keep receiving nothing while looking enabled.
			await subscription?.unsubscribe()
			if (!current) return pushService.getSubscriptions()
			return pushService.unregister({ endpoint: current })
		},
		onSuccess: response => {
			queryClient.setQueryData(pushKeys.subscriptions, response)
			void refreshDeviceState()
			setError(null)
		},
		onError: (mutationError: Error) => setError(mutationError.message),
	})

	const isSubscribed = Boolean(
		endpoint &&
		data?.subscriptions.some(subscription => subscription.isCurrentDevice),
	)

	const status = resolvePushStatus({
		supported: hasPushSupport(),
		permission,
		// The server marks the current device only when the endpoint was sent
		// with the read, so registration state is confirmed by the local one.
		isSubscribed:
			isSubscribed || (Boolean(endpoint) && permission === 'granted'),
		vapidPublicKey: data?.vapidPublicKey ?? null,
		isStandalone:
			typeof window !== 'undefined' &&
			window.matchMedia('(display-mode: standalone)').matches,
		isIos:
			typeof navigator !== 'undefined' &&
			isIosDevice(navigator.userAgent, navigator.maxTouchPoints ?? 0),
	})

	return {
		...status,
		isPending: enable.isPending || disable.isPending,
		error,
		enable: async () => {
			await enable.mutateAsync().catch(() => undefined)
		},
		disable: async () => {
			await disable.mutateAsync().catch(() => undefined)
		},
	}
}
