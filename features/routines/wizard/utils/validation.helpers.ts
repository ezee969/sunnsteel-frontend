export const sanitizeIntegerInput = (value: string) => value.replace(/[^0-9]/g, '')

export const sanitizeDecimalInput = (value: string) =>
	value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')

export const parseOptionalPositiveFloat = (value: string) => {
	const trimmed = value.trim()
	if (trimmed === '') {
		return undefined
	}
	const parsed = Number.parseFloat(trimmed)
	if (Number.isNaN(parsed) || parsed < 0) {
		return undefined
	}
	return parsed
}
