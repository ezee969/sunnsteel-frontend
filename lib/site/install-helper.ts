/**
 * SITE-01 §12.12 and §33.11: the install helper a phone sees when the closing
 * band's QR code opens `/?install=1`. No page can install itself -- every
 * browser asks for the visitor's own tap -- so the helper only puts the way
 * in front of them:
 *
 * - `prompt`: the browser offers installation (Chrome, Edge and Samsung
 *   Internet on Android fire `beforeinstallprompt`), and one button opens its
 *   own dialog;
 * - `ios`: Safari on iPhone and iPad, which has no such event, gets the two
 *   steps, Share then Add to Home Screen;
 * - `answer`: any other phone browser gets the written answer alone;
 * - `none`: no `?install=1`, an app already installed, or a computer.
 */
export type InstallHelperKind = 'none' | 'prompt' | 'ios' | 'answer'

export interface InstallContext {
	/** The address carries `install=1`. */
	asked: boolean
	/** A touch device (`pointer: coarse`): a computer gets no helper. */
	touch: boolean
	/** Already running as the installed app. */
	standalone: boolean
	/** The browser handed over a `beforeinstallprompt` event. */
	promptAvailable: boolean
	userAgent: string
	/** iPadOS presents itself as a Mac; its touch points give it away. */
	maxTouchPoints: number
}

export function isIosSafari(userAgent: string, maxTouchPoints: number) {
	const ios =
		/iPhone|iPad|iPod/.test(userAgent) ||
		(/Macintosh/.test(userAgent) && maxTouchPoints > 1)
	// Chrome, Firefox and Edge on iOS name themselves; their share menus
	// differ from Safari's, so the steps would not match what they show.
	const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent)
	return ios && /Safari/.test(userAgent) && !otherBrowser
}

export function installHelperKind(context: InstallContext): InstallHelperKind {
	if (!context.asked || context.standalone || !context.touch) return 'none'
	if (context.promptAvailable) return 'prompt'
	if (isIosSafari(context.userAgent, context.maxTouchPoints)) return 'ios'
	return 'answer'
}
