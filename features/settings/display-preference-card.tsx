'use client'

import { Eye } from 'lucide-react'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useDisplayPreference } from '@/hooks/use-display-preference'

/**
 * A11Y-02. Both choices are stored on this device only and apply before first
 * paint, like Motion above. Higher contrast also follows the device's own
 * setting, which this choice can add to but never turn off.
 */
export function DisplayPreferenceCard() {
	const {
		contrast,
		systemMoreContrast,
		controlSize,
		setContrast,
		setControlSize,
	} = useDisplayPreference()

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<Eye className="h-5 w-5 text-primary" aria-hidden />
					<CardTitle>Display</CardTitle>
				</div>
				<CardDescription>
					Make Sunnsteel easier to read and to tap on this device, for example
					in a bright gym.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="grid min-h-14 grid-cols-[minmax(0,1fr)_44px] items-center gap-3">
					<div className="space-y-1">
						<Label htmlFor="display-contrast">Higher contrast</Label>
						<p className="type-body-sm text-ink-3">
							Darker text in the light theme and brighter text in the dark one,
							stronger borders, and a thicker outline on the focused control.
						</p>
					</div>
					<Label
						htmlFor="display-contrast"
						className="flex size-11 cursor-pointer items-center justify-center"
					>
						<Checkbox
							id="display-contrast"
							checked={contrast === 'more' || systemMoreContrast}
							disabled={systemMoreContrast}
							onCheckedChange={checked =>
								setContrast(checked === true ? 'more' : 'system')
							}
							aria-label="Higher contrast"
							className="size-5"
						/>
					</Label>
				</div>
				{systemMoreContrast ? (
					<p className="type-body-sm text-ink-3" role="status">
						Your device already asks for more contrast, so it is on everywhere.
						Change it in your device&apos;s accessibility settings.
					</p>
				) : null}
				<div className="grid min-h-14 grid-cols-[minmax(0,1fr)_44px] items-center gap-3 border-t border-rule-faint pt-3">
					<div className="space-y-1">
						<Label htmlFor="display-controls">Larger controls</Label>
						<p className="type-body-sm text-ink-3">
							Bigger buttons, fields and checkboxes everywhere. During a workout
							it also enlarges the set fields and the rest timer, and puts the
							less-used actions in one menu per exercise and per set. You can
							also switch it from the workout screen.
						</p>
					</div>
					<Label
						htmlFor="display-controls"
						className="flex size-11 cursor-pointer items-center justify-center"
					>
						<Checkbox
							id="display-controls"
							checked={controlSize === 'large'}
							onCheckedChange={checked =>
								setControlSize(checked === true ? 'large' : 'standard')
							}
							aria-label="Larger controls"
							className="size-5"
						/>
					</Label>
				</div>
			</CardContent>
		</Card>
	)
}
