import type { LengthUnit, WeightUnit } from '@sunsteel/contracts'

/** The regions that measure bodies and loads in pounds and inches. */
const IMPERIAL_REGIONS = new Set(['US', 'LR', 'MM'])

/**
 * UX-26: the units for a signed-out visitor, who has no account to read
 * them from. The public profile carries no units of its own, so the page
 * used to show every visitor kilograms and centimetres. The browser's first
 * language with a region decides: pounds and inches in the United States,
 * Liberia and Myanmar, metric everywhere else and when no region is known.
 */
export function visitorUnits(languages: readonly string[]): {
	weightUnit: WeightUnit
	lengthUnit: LengthUnit
} {
	const region = languages
		.map(tag => tag.split(/[-_]/)[1]?.toUpperCase())
		.find(part => part && /^[A-Z]{2}$/.test(part))
	return region && IMPERIAL_REGIONS.has(region)
		? { weightUnit: 'LB', lengthUnit: 'IN' }
		: { weightUnit: 'KG', lengthUnit: 'CM' }
}
