/**
 * BILL-06: the month a moderator downloads charges for. The owner invoices a
 * month once it is over, so the month before the current one is offered.
 * `YYYY-MM`, the value an `<input type="month">` reads and the server takes.
 */
export function previousMonth(now: Date): string {
	const year = now.getFullYear()
	const month = now.getMonth() // 0-based: already the previous month's 1-based number
	return month === 0
		? `${year - 1}-12`
		: `${year}-${String(month).padStart(2, '0')}`
}

/** The saved file's name. */
export function chargesFileName(month: string): string {
	return `cobros-${month}.csv`
}
