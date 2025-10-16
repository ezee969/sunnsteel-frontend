/**
 * Timezone Utilities
 * 
 * Provides a curated list of common IANA timezones grouped by region
 * for use in timezone selection components.
 */

export interface TimezoneOption {
	value: string // IANA timezone identifier
	label: string // Human-readable label
	offset: string // UTC offset (e.g., "UTC-5")
	region: string // Geographic region
}

/**
 * Get the current UTC offset for a timezone
 */
function getTimezoneOffset(timezone: string): string {
	try {
		const now = new Date()
		const formatter = new Intl.DateTimeFormat('en-US', {
			timeZone: timezone,
			timeZoneName: 'shortOffset',
		})
		const parts = formatter.formatToParts(now)
		const offset = parts.find(part => part.type === 'timeZoneName')?.value || ''
		return offset.replace('GMT', 'UTC')
	} catch {
		return 'UTC'
	}
}

/**
 * Common timezones grouped by region
 * Covers major cities and regions worldwide
 */
export const COMMON_TIMEZONES: TimezoneOption[] = [
	// Americas - North
	{ value: 'America/New_York', label: 'New York', offset: '', region: 'Americas' },
	{ value: 'America/Chicago', label: 'Chicago', offset: '', region: 'Americas' },
	{ value: 'America/Denver', label: 'Denver', offset: '', region: 'Americas' },
	{ value: 'America/Los_Angeles', label: 'Los Angeles', offset: '', region: 'Americas' },
	{ value: 'America/Anchorage', label: 'Anchorage', offset: '', region: 'Americas' },
	{ value: 'America/Phoenix', label: 'Phoenix', offset: '', region: 'Americas' },
	{ value: 'America/Toronto', label: 'Toronto', offset: '', region: 'Americas' },
	{ value: 'America/Vancouver', label: 'Vancouver', offset: '', region: 'Americas' },
	{ value: 'America/Mexico_City', label: 'Mexico City', offset: '', region: 'Americas' },
	
	// Americas - South
	{ value: 'America/Sao_Paulo', label: 'São Paulo', offset: '', region: 'Americas' },
	{ value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires', offset: '', region: 'Americas' },
	{ value: 'America/Santiago', label: 'Santiago', offset: '', region: 'Americas' },
	{ value: 'America/Lima', label: 'Lima', offset: '', region: 'Americas' },
	{ value: 'America/Bogota', label: 'Bogotá', offset: '', region: 'Americas' },
	{ value: 'America/Caracas', label: 'Caracas', offset: '', region: 'Americas' },
	
	// Europe
	{ value: 'Europe/London', label: 'London', offset: '', region: 'Europe' },
	{ value: 'Europe/Paris', label: 'Paris', offset: '', region: 'Europe' },
	{ value: 'Europe/Berlin', label: 'Berlin', offset: '', region: 'Europe' },
	{ value: 'Europe/Madrid', label: 'Madrid', offset: '', region: 'Europe' },
	{ value: 'Europe/Rome', label: 'Rome', offset: '', region: 'Europe' },
	{ value: 'Europe/Amsterdam', label: 'Amsterdam', offset: '', region: 'Europe' },
	{ value: 'Europe/Brussels', label: 'Brussels', offset: '', region: 'Europe' },
	{ value: 'Europe/Vienna', label: 'Vienna', offset: '', region: 'Europe' },
	{ value: 'Europe/Warsaw', label: 'Warsaw', offset: '', region: 'Europe' },
	{ value: 'Europe/Athens', label: 'Athens', offset: '', region: 'Europe' },
	{ value: 'Europe/Istanbul', label: 'Istanbul', offset: '', region: 'Europe' },
	{ value: 'Europe/Moscow', label: 'Moscow', offset: '', region: 'Europe' },
	
	// Asia
	{ value: 'Asia/Dubai', label: 'Dubai', offset: '', region: 'Asia' },
	{ value: 'Asia/Kolkata', label: 'Mumbai/Kolkata', offset: '', region: 'Asia' },
	{ value: 'Asia/Bangkok', label: 'Bangkok', offset: '', region: 'Asia' },
	{ value: 'Asia/Singapore', label: 'Singapore', offset: '', region: 'Asia' },
	{ value: 'Asia/Hong_Kong', label: 'Hong Kong', offset: '', region: 'Asia' },
	{ value: 'Asia/Shanghai', label: 'Shanghai', offset: '', region: 'Asia' },
	{ value: 'Asia/Tokyo', label: 'Tokyo', offset: '', region: 'Asia' },
	{ value: 'Asia/Seoul', label: 'Seoul', offset: '', region: 'Asia' },
	{ value: 'Asia/Jakarta', label: 'Jakarta', offset: '', region: 'Asia' },
	{ value: 'Asia/Manila', label: 'Manila', offset: '', region: 'Asia' },
	{ value: 'Asia/Taipei', label: 'Taipei', offset: '', region: 'Asia' },
	
	// Pacific
	{ value: 'Australia/Sydney', label: 'Sydney', offset: '', region: 'Pacific' },
	{ value: 'Australia/Melbourne', label: 'Melbourne', offset: '', region: 'Pacific' },
	{ value: 'Australia/Brisbane', label: 'Brisbane', offset: '', region: 'Pacific' },
	{ value: 'Australia/Perth', label: 'Perth', offset: '', region: 'Pacific' },
	{ value: 'Pacific/Auckland', label: 'Auckland', offset: '', region: 'Pacific' },
	{ value: 'Pacific/Fiji', label: 'Fiji', offset: '', region: 'Pacific' },
	{ value: 'Pacific/Honolulu', label: 'Honolulu', offset: '', region: 'Pacific' },
	
	// Africa
	{ value: 'Africa/Cairo', label: 'Cairo', offset: '', region: 'Africa' },
	{ value: 'Africa/Johannesburg', label: 'Johannesburg', offset: '', region: 'Africa' },
	{ value: 'Africa/Lagos', label: 'Lagos', offset: '', region: 'Africa' },
	{ value: 'Africa/Nairobi', label: 'Nairobi', offset: '', region: 'Africa' },
	
	// UTC
	{ value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: 'UTC+0', region: 'UTC' },
].map(tz => ({
	...tz,
	offset: tz.offset || getTimezoneOffset(tz.value),
}))

/**
 * Get timezone options grouped by region
 */
export function getTimezonesByRegion(): Record<string, TimezoneOption[]> {
	return COMMON_TIMEZONES.reduce((acc, tz) => {
		if (!acc[tz.region]) {
			acc[tz.region] = []
		}
		acc[tz.region].push(tz)
		return acc
	}, {} as Record<string, TimezoneOption[]>)
}

/**
 * Search timezones by label or value
 */
export function searchTimezones(query: string): TimezoneOption[] {
	const lowerQuery = query.toLowerCase()
	return COMMON_TIMEZONES.filter(
		tz =>
			tz.label.toLowerCase().includes(lowerQuery) ||
			tz.value.toLowerCase().includes(lowerQuery) ||
			tz.offset.toLowerCase().includes(lowerQuery)
	)
}

/**
 * Get the user's system timezone
 */
export function getSystemTimezone(): string {
	return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Find timezone option by value
 */
export function findTimezoneOption(value: string): TimezoneOption | undefined {
	return COMMON_TIMEZONES.find(tz => tz.value === value)
}
