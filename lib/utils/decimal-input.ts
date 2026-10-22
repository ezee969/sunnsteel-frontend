/**
 * A decimal as a member types it. A phone set to a region that writes 2,5
 * (Argentina, Spain…) puts a comma on its decimal keypad and no point, so a
 * comma here is always the decimal mark, never grouping. Fields hold the
 * point once typed -- `formatWeightInput` writes one and every parser reads
 * one -- and `Number.parseFloat('2,5')` alone would read 2.
 */
export const normalizeDecimalInput = (value: string) =>
	value.trim().replace(/,/g, '.')

/** Digits and one point, a typed comma becoming the point. */
export const sanitizeDecimalInput = (value: string) =>
	value
		.replace(/,/g, '.')
		.replace(/[^0-9.]/g, '')
		.replace(/(\..*)\./g, '$1')
