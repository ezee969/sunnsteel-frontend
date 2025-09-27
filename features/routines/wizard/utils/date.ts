import { format, parse } from 'date-fns'

const ISO_DATE_PATTERN = 'yyyy-MM-dd'
const DISPLAY_DATE_PATTERN = 'dd/MM/yyyy'

export function parseWizardDate(value?: string) {
	if (!value) return undefined
	const [year, month, day] = value.split('-').map(Number)
	const date = new Date(year, month - 1, day)
	return Number.isNaN(date.getTime()) ? undefined : date
}

export function formatWizardDate(date: Date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

export function formatDateForDisplay(value?: string) {
	const parsed = parseWizardDate(value)
	if (!parsed) return '—'
	return format(parsed, DISPLAY_DATE_PATTERN)
}

export function isPastDate(date: Date) {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	return date < today
}

export function parseDateInput(value: string) {
	if (!value) return undefined
	return parse(value, ISO_DATE_PATTERN, new Date())
}
