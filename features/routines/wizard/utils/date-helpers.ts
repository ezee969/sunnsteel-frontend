export const getWeekdayFromIsoDate = (isoDate: string | undefined | null): number | null => {
	if (!isoDate) {
		return null
	}

	const [year, month, day] = isoDate.split('-').map(Number)
	if (
		Number.isNaN(year) ||
		Number.isNaN(month) ||
		Number.isNaN(day) ||
		month < 1 ||
		month > 12 ||
		day < 1 ||
		day > 31
	) {
		return null
	}

	return new Date(year, month - 1, day).getDay()
}

export const sortNumbersAscending = (values: number[]): number[] => [...values].sort((a, b) => a - b)
