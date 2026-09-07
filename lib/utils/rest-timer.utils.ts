/** Seconds added by the "+15s" control. */
export const REST_TIMER_EXTEND_SECONDS = 15

/**
 * Whole seconds left until `deadlineMs`, never negative.
 *
 * The timer derives every reading from an absolute deadline instead of
 * accumulating ticks. A phone that sleeps, or a browser that throttles timers
 * in a background tab, would otherwise drift by exactly the time the user spent
 * away -- which is most of a rest period.
 *
 * Rounds up so a running timer never displays 0 before the deadline is actually
 * reached: 1ms left still reads as one second.
 */
export function remainingSeconds(deadlineMs: number, nowMs: number): number {
	return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000))
}

/**
 * Format seconds as `m:ss`, so 90 reads as `1:30`.
 *
 * Minutes are unpadded and seconds always padded, which is how a stopwatch
 * reads. Negative and fractional inputs are clamped rather than rejected: this
 * renders during a live session and must never produce `NaN:aN`.
 */
export function formatRestTime(totalSeconds: number): string {
	const safe = Number.isFinite(totalSeconds)
		? Math.max(0, Math.floor(totalSeconds))
		: 0
	const minutes = Math.floor(safe / 60)
	const seconds = safe % 60
	return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * Elapsed fraction of the rest period, 0 to 1, for the progress indicator.
 * A non-positive total means there is nothing to show progress against.
 */
export function restProgress(remaining: number, totalSeconds: number): number {
	if (totalSeconds <= 0) return 0
	const elapsed = totalSeconds - Math.max(0, Math.min(remaining, totalSeconds))
	return elapsed / totalSeconds
}
