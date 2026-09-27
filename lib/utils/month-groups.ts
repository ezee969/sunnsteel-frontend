/**
 * UX-03: a long list of dated rows, already in order, split at each change
 * of local calendar month so a long scroll has landmarks. The order is never
 * changed; a month appears once for each run of rows in it, so a list sorted
 * oldest first reads oldest first too.
 */
export interface MonthGroup<T> {
	/** `YYYY-MM` in the device's time zone. */
	key: string
	label: string
	items: T[]
}

export function monthKey(date: Date): string {
	const month = String(date.getMonth() + 1).padStart(2, '0')
	return `${date.getFullYear()}-${month}`
}

export function monthLabel(date: Date, locale?: string): string {
	return new Intl.DateTimeFormat(locale, {
		month: 'long',
		year: 'numeric',
	}).format(date)
}

export function groupByMonth<T>(
	items: readonly T[],
	dateOf: (item: T) => string | Date,
	locale?: string,
): MonthGroup<T>[] {
	const groups: MonthGroup<T>[] = []
	for (const item of items) {
		const date = new Date(dateOf(item))
		const key = monthKey(date)
		const last = groups[groups.length - 1]
		if (last && last.key === key) {
			last.items.push(item)
		} else {
			groups.push({ key, label: monthLabel(date, locale), items: [item] })
		}
	}
	return groups
}
