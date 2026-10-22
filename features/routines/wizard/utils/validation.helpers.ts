import { normalizeDecimalInput } from '@/lib/utils/decimal-input'

export { sanitizeDecimalInput } from '@/lib/utils/decimal-input'

export const sanitizeIntegerInput = (value: string) =>
	value.replace(/[^0-9]/g, '')

export const parseOptionalPositiveFloat = (value: string) => {
	const trimmed = normalizeDecimalInput(value)
	if (trimmed === '') {
		return undefined
	}
	const parsed = Number.parseFloat(trimmed)
	if (Number.isNaN(parsed) || parsed < 0) {
		return undefined
	}
	return parsed
}
