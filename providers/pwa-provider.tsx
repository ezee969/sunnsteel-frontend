'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'

import {
	isSunnsteelCacheName,
	shouldDeferServiceWorkerUpdate,
} from '@/lib/pwa/service-worker-policy'
import { logger } from '@/lib/utils/logger'

const SERVICE_WORKER_URL = '/sw.js'

const cleanupDevelopmentPwa = async (): Promise<boolean> => {
	const registration = await navigator.serviceWorker.getRegistration()
	const registeredWorker =
		registration?.active ?? registration?.waiting ?? registration?.installing
	const controller = navigator.serviceWorker.controller

	const ownsRegistration =
		registeredWorker !== null &&
		registeredWorker !== undefined &&
		new URL(registeredWorker.scriptURL).pathname === SERVICE_WORKER_URL
	const ownsController =
		controller !== null &&
		new URL(controller.scriptURL).pathname === SERVICE_WORKER_URL

	const registrationRemoved =
		ownsRegistration && registration ? await registration.unregister() : false

	let cacheRemoved = false
	if ('caches' in window) {
		const cacheNames = await caches.keys()
		const results = await Promise.all(
			cacheNames
				.filter(isSunnsteelCacheName)
				.map(cacheName => caches.delete(cacheName)),
		)
		cacheRemoved = results.some(Boolean)
	}

	if (registrationRemoved || cacheRemoved) {
		logger.debug('[PWA] Removed development service worker state')
	}

	return ownsController
}

export const PwaProvider = (): null => {
	const pathname = usePathname()
	const deferUpdate = shouldDeferServiceWorkerUpdate(pathname)
	const deferUpdateRef = useRef(deferUpdate)
	const registrationRef = useRef<ServiceWorkerRegistration | null>(null)
	const activationRequestedRef = useRef(false)
	const reloadPendingRef = useRef(false)
	const reloadedRef = useRef(false)

	const reloadOnce = useCallback(() => {
		if (reloadedRef.current) return
		reloadedRef.current = true
		window.location.reload()
	}, [])

	useEffect(() => {
		deferUpdateRef.current = deferUpdate

		if (deferUpdate) return

		if (reloadPendingRef.current) {
			reloadOnce()
			return
		}

		if (process.env.NODE_ENV !== 'production') return

		const waitingWorker = registrationRef.current?.waiting
		if (!waitingWorker) return

		activationRequestedRef.current = true
		logger.debug('[PWA] Activating deferred service worker update')
		waitingWorker.postMessage({ type: 'SKIP_WAITING' })
	}, [deferUpdate, reloadOnce])

	useEffect(() => {
		if (!('serviceWorker' in navigator)) return

		if (process.env.NODE_ENV !== 'production') {
			let cancelled = false

			void cleanupDevelopmentPwa()
				.then(shouldReload => {
					if (cancelled || !shouldReload) return

					if (deferUpdateRef.current) {
						reloadPendingRef.current = true
						return
					}

					reloadOnce()
				})
				.catch(error => {
					logger.warn('[PWA] Could not clean development worker state', error)
				})

			return () => {
				cancelled = true
			}
		}

		let disposed = false
		let registration: ServiceWorkerRegistration | null = null
		let removeInstallingWorkerListener: (() => void) | null = null
		let removeUpdateFoundListener: (() => void) | null = null
		const hadControllerAtMount = Boolean(navigator.serviceWorker.controller)

		const activateWorker = (worker: ServiceWorker): void => {
			if (deferUpdateRef.current) {
				logger.debug('[PWA] Deferring update during active workout')
				return
			}

			activationRequestedRef.current = true
			logger.debug('[PWA] Activating new service worker')
			worker.postMessage({ type: 'SKIP_WAITING' })
		}

		const onControllerChange = () => {
			if (!hadControllerAtMount && !activationRequestedRef.current) return

			if (deferUpdateRef.current) {
				reloadPendingRef.current = true
				logger.debug('[PWA] Deferring reload during active workout')
				return
			}

			reloadOnce()
		}

		navigator.serviceWorker.addEventListener(
			'controllerchange',
			onControllerChange,
		)

		void navigator.serviceWorker
			.register(SERVICE_WORKER_URL)
			.then(nextRegistration => {
				if (disposed) return

				registration = nextRegistration
				registrationRef.current = nextRegistration

				if (nextRegistration.waiting) {
					activateWorker(nextRegistration.waiting)
				}

				const onUpdateFound = () => {
					const newWorker = nextRegistration.installing
					if (!newWorker) return

					removeInstallingWorkerListener?.()
					const onStateChange = () => {
						if (
							newWorker.state === 'installed' &&
							navigator.serviceWorker.controller
						) {
							activateWorker(newWorker)
						}
					}

					newWorker.addEventListener('statechange', onStateChange)
					removeInstallingWorkerListener = () => {
						newWorker.removeEventListener('statechange', onStateChange)
					}
				}

				nextRegistration.addEventListener('updatefound', onUpdateFound)
				removeUpdateFoundListener = () => {
					nextRegistration.removeEventListener('updatefound', onUpdateFound)
				}
			})
			.catch(error => {
				logger.warn('[PWA] Service worker registration failed', error)
			})

		return () => {
			disposed = true
			removeInstallingWorkerListener?.()
			removeUpdateFoundListener?.()
			if (registrationRef.current === registration) {
				registrationRef.current = null
			}
			navigator.serviceWorker.removeEventListener(
				'controllerchange',
				onControllerChange,
			)
		}
	}, [reloadOnce])

	return null
}
