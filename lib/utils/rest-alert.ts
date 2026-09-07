/**
 * End-of-rest alert: a short tone plus a vibration pattern.
 *
 * The tone is synthesised rather than loaded from a file so the installed PWA
 * gains no audio asset and no extra request for two hundred milliseconds of
 * beep.
 *
 * Both channels are best-effort. Vibration does not exist on iOS Safari, audio
 * can be refused outright, and a user in a quiet gym may have the device muted.
 * A missed alert must never interrupt training, so nothing here throws or
 * reports failure.
 */

type WebkitWindow = Window & {
	webkitAudioContext?: typeof AudioContext
}

const getAudioContextCtor = (): typeof AudioContext | undefined => {
	if (typeof window === 'undefined') return undefined
	return window.AudioContext ?? (window as WebkitWindow).webkitAudioContext
}

export interface RestAlert {
	/**
	 * Call from inside the user gesture that starts the rest period. Browsers
	 * only allow an AudioContext to start from a gesture, and the alert fires
	 * minutes later with no gesture of its own -- priming here is what makes the
	 * tone audible at all.
	 */
	prime: () => void
	fire: () => void
	dispose: () => void
}

export function createRestAlert(): RestAlert {
	let context: AudioContext | null = null

	const prime = () => {
		try {
			const Ctor = getAudioContextCtor()
			if (!Ctor) return
			context ??= new Ctor()
			// Autoplay policies park a context created outside a gesture in
			// 'suspended'; resuming inside one is what unlocks later playback.
			if (context.state === 'suspended') void context.resume()
		} catch {
			context = null
		}
	}

	const playTone = () => {
		if (!context || context.state !== 'running') return
		const oscillator = context.createOscillator()
		const gain = context.createGain()

		oscillator.type = 'sine'
		oscillator.frequency.value = 880
		// Ramp instead of a hard stop: an abrupt cut produces an audible click.
		gain.gain.setValueAtTime(0.0001, context.currentTime)
		gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.01)
		gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35)

		oscillator.connect(gain)
		gain.connect(context.destination)
		oscillator.start()
		oscillator.stop(context.currentTime + 0.36)
	}

	const fire = () => {
		try {
			playTone()
		} catch {
			// Muted, refused, or the context died with the page. Not worth a retry.
		}
		try {
			navigator.vibrate?.([200, 100, 200])
		} catch {
			// Absent on iOS Safari and ignorable everywhere else.
		}
	}

	const dispose = () => {
		try {
			void context?.close()
		} catch {
			// Already closed.
		}
		context = null
	}

	return { prime, fire, dispose }
}
