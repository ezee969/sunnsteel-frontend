'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import {
	COMMON_TIMEZONES,
	getTimezonesByRegion,
	findTimezoneOption,
	getSystemTimezone,
	type TimezoneOption,
} from '@/lib/utils/timezones'

interface TimezoneSelectorProps {
	value?: string
	onChange: (timezone: string) => void
	placeholder?: string
	className?: string
}

export function TimezoneSelector({
	value,
	onChange,
	placeholder = 'Select timezone...',
	className,
}: TimezoneSelectorProps) {
	const [open, setOpen] = React.useState(false)
	const [search, setSearch] = React.useState('')

	const timezonesByRegion = getTimezonesByRegion()
	const systemTimezone = getSystemTimezone()
	
	// Find selected timezone or create fallback for unknown timezones
	const selectedTimezone = React.useMemo(() => {
		if (!value) return undefined
		
		const found = findTimezoneOption(value)
		if (found) return found
		
		// Fallback for timezones not in our curated list
		// Extract city name from IANA identifier (e.g., "America/Argentina/Buenos_Aires" -> "Buenos Aires")
		const parts = value.split('/')
		const cityName = parts[parts.length - 1].replace(/_/g, ' ')
		
		// Calculate offset dynamically
		const getOffset = () => {
			try {
				const now = new Date()
				const formatter = new Intl.DateTimeFormat('en-US', {
					timeZone: value,
					timeZoneName: 'shortOffset',
				})
				const offsetPart = formatter.formatToParts(now).find(p => p.type === 'timeZoneName')
				return offsetPart?.value.replace('GMT', 'UTC') || 'UTC'
			} catch {
				return 'UTC'
			}
		}
		
		return {
			value,
			label: cityName,
			offset: getOffset(),
			region: 'Other',
		}
	}, [value])

	// Filter timezones based on search
	const filteredTimezones = React.useMemo(() => {
		if (!search) return timezonesByRegion

		const lowerSearch = search.toLowerCase()
		const filtered: Record<string, TimezoneOption[]> = {}

		Object.entries(timezonesByRegion).forEach(([region, timezones]) => {
			const matches = timezones.filter(
				tz =>
					tz.label.toLowerCase().includes(lowerSearch) ||
					tz.value.toLowerCase().includes(lowerSearch) ||
					tz.offset.toLowerCase().includes(lowerSearch)
			)
			if (matches.length > 0) {
				filtered[region] = matches
			}
		})

		return filtered
	}, [search, timezonesByRegion])

	const handleSelect = (timezone: string) => {
		onChange(timezone)
		setOpen(false)
		setSearch('')
	}

	const handleUseSystem = () => {
		onChange(systemTimezone)
		setOpen(false)
		setSearch('')
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn('w-full justify-between', className)}
				>
					{selectedTimezone ? (
						<span className="flex items-center gap-2">
							<MapPin className="h-4 w-4 text-muted-foreground" />
							<span className="truncate">
								{selectedTimezone.label}
								<span className="ml-2 text-xs text-muted-foreground">
									{selectedTimezone.offset}
								</span>
							</span>
						</span>
					) : (
						<span className="text-muted-foreground">{placeholder}</span>
					)}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[400px] p-0" align="start">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search timezones..."
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList>
						<CommandEmpty>No timezone found.</CommandEmpty>

						{/* System Timezone Quick Action */}
						<CommandGroup heading="Quick Select">
							<CommandItem
								value={systemTimezone}
								onSelect={handleUseSystem}
								className="cursor-pointer"
							>
								<Check
									className={cn(
										'mr-2 h-4 w-4',
										value === systemTimezone ? 'opacity-100' : 'opacity-0'
									)}
								/>
								<MapPin className="mr-2 h-4 w-4 text-blue-500" />
								<span className="flex-1">
									Use system timezone
									<span className="ml-2 text-xs text-muted-foreground">
										({(() => {
											const found = findTimezoneOption(systemTimezone)
											if (found) return found.label
											// Fallback: extract city name from IANA identifier
											const parts = systemTimezone.split('/')
											return parts[parts.length - 1].replace(/_/g, ' ')
										})()})
									</span>
								</span>
							</CommandItem>
						</CommandGroup>

						{/* Timezones by Region */}
						{Object.entries(filteredTimezones).map(([region, timezones]) => (
							<CommandGroup key={region} heading={region}>
								{timezones.map(tz => (
									<CommandItem
										key={tz.value}
										value={tz.value}
										onSelect={() => handleSelect(tz.value)}
										className="cursor-pointer"
									>
										<Check
											className={cn(
												'mr-2 h-4 w-4',
												value === tz.value ? 'opacity-100' : 'opacity-0'
											)}
										/>
										<span className="flex-1">
											{tz.label}
											<span className="ml-2 text-xs text-muted-foreground">
												{tz.offset}
											</span>
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						))}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
