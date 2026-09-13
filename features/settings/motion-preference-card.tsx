'use client'

import { Accessibility } from 'lucide-react'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useMotionPreference } from '@/hooks/use-motion-preference'

/**
 * A11Y-01. Stored on this device only: it applies before first paint without
 * waiting for the account to load, including on the splash and the signed-out
 * pages. It can add reduction but never re-enables motion the OS reduced.
 */
export function MotionPreferenceCard() {
	const { preference, systemReduced, setPreference } = useMotionPreference()
	const id = 'motion-reduce'

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<Accessibility className="h-5 w-5 text-primary" aria-hidden />
					<CardTitle>Motion</CardTitle>
				</div>
				<CardDescription>
					Choose how much animation Sunnsteel uses on this device.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="grid min-h-14 grid-cols-[minmax(0,1fr)_44px] items-center gap-3">
					<div className="space-y-1">
						<Label htmlFor={id}>Reduce motion</Label>
						<p className="type-body-sm text-ink-3">
							Removes sliding, scaling, spinning and pulsing, and shortens
							fades. Nothing on screen is hidden. Applies immediately.
						</p>
					</div>
					<Label
						htmlFor={id}
						className="flex size-11 cursor-pointer items-center justify-center"
					>
						<Checkbox
							id={id}
							checked={preference === 'reduce' || systemReduced}
							disabled={systemReduced}
							onCheckedChange={checked =>
								setPreference(checked === true ? 'reduce' : 'system')
							}
							aria-label="Reduce motion"
							className="size-5"
						/>
					</Label>
				</div>
				{systemReduced ? (
					<p className="type-body-sm text-ink-3" role="status">
						Your device already asks for reduced motion, so it is on everywhere.
						Change it in your device&apos;s accessibility settings.
					</p>
				) : null}
			</CardContent>
		</Card>
	)
}
