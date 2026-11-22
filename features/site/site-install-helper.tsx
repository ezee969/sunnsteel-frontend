'use client'

import { Share, SquarePlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'

import {
	type InstallHelperKind,
	installHelperKind,
} from '@/lib/site/install-helper'

/**
 * SITE-01 §12.12 and §33.11: what a phone sees at the top of the landing
 * when the closing band's QR code opens `/?install=1` -- the "Do I need to
 * download anything?" answer, and one way in: the browser's own install
 * dialog behind one button where it offers one, Safari's two steps on iPhone
 * and iPad, nothing more elsewhere. Nothing installs itself; a computer or
 * the installed app sees no helper. It sits inside the hero's Night region.
 */
interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
	interface Window {
		/** Caught before React runs by `INSTALL_PROMPT_SCRIPT`. */
		__ssInstallPrompt?: BeforeInstallPromptEvent
	}
}

/**
 * Runs as the page is parsed: the browser can offer installation before
 * React has mounted, so the event is kept for the helper. Only on
 * `?install=1`, so the browser's own install hint is left alone elsewhere.
 */
export const INSTALL_PROMPT_SCRIPT =
	"if(/[?&]install=1(&|$)/.test(location.search)){addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__ssInstallPrompt=e;dispatchEvent(new Event('ss-install-ready'))})}"

function readKind(): InstallHelperKind {
	return installHelperKind({
		asked: new URLSearchParams(window.location.search).get('install') === '1',
		touch: window.matchMedia('(pointer: coarse)').matches,
		standalone:
			window.matchMedia('(display-mode: standalone)').matches ||
			(navigator as Navigator & { standalone?: boolean }).standalone === true,
		promptAvailable: window.__ssInstallPrompt !== undefined,
		userAgent: navigator.userAgent,
		maxTouchPoints: navigator.maxTouchPoints,
	})
}

export function SiteInstallHelper() {
	const t = useTranslations('site.closing.helper')
	const tAnswer = useTranslations('site.questions.items.install')
	const [kind, setKind] = useState<InstallHelperKind>('none')

	useEffect(() => {
		const update = () => setKind(readKind())
		update()
		const installed = () => setKind('none')
		window.addEventListener('ss-install-ready', update)
		window.addEventListener('appinstalled', installed)
		return () => {
			window.removeEventListener('ss-install-ready', update)
			window.removeEventListener('appinstalled', installed)
		}
	}, [])

	const install = useCallback(async () => {
		const offer = window.__ssInstallPrompt
		if (!offer) return
		await offer.prompt()
		const { outcome } = await offer.userChoice
		// A prompt can be used once; without it the written answer stays.
		window.__ssInstallPrompt = undefined
		setKind(outcome === 'accepted' ? 'none' : readKind())
	}, [])

	if (kind === 'none') return null

	return (
		<aside
			aria-labelledby="install-helper-title"
			className="site-install-helper"
		>
			<p id="install-helper-title" className="type-section">
				{t('title')}
			</p>
			{kind === 'ios' ? (
				<>
					<ol className="site-install-steps">
						<li>
							<Share className="size-5 shrink-0" aria-hidden />
							<span>{t('iosShare')}</span>
						</li>
						<li>
							<SquarePlus className="size-5 shrink-0" aria-hidden />
							<span>{t('iosAdd')}</span>
						</li>
					</ol>
					<p className="type-body-sm text-ink-2">{t('iosNote')}</p>
				</>
			) : (
				<p className="type-body text-ink-2">{tAnswer('answer')}</p>
			)}
			<div className="site-install-actions">
				{kind === 'prompt' ? (
					<button
						type="button"
						onClick={() => void install()}
						className="site-filled site-filled-hero"
					>
						{t('install')}
					</button>
				) : null}
				<button
					type="button"
					onClick={() => setKind('none')}
					className="site-ghost type-action"
				>
					<span>{t('dismiss')}</span>
				</button>
			</div>
		</aside>
	)
}
