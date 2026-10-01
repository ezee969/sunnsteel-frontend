'use client'

import { Accessibility } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Explanation } from '@/components/layout/explanation'
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
	const t = useTranslations('settings.motion')
	const { preference, systemReduced, setPreference } = useMotionPreference()
	const id = 'motion-reduce'

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<Accessibility className="h-5 w-5 text-primary" aria-hidden />
					<CardTitle>{t('title')}</CardTitle>
				</div>
				<CardDescription>{t('description')}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="grid min-h-14 grid-cols-[minmax(0,1fr)_44px] items-center gap-3">
					<div className="space-y-1">
						<Label htmlFor={id}>{t('reduce')}</Label>
						<Explanation summary={t('reduceNoteSummary')}>
							<p>{t('reduceNote')}</p>
						</Explanation>
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
							aria-label={t('reduce')}
							className="size-5"
						/>
					</Label>
				</div>
				{systemReduced ? (
					<p className="type-body-sm text-ink-3" role="status">
						{t('systemReduced')}
					</p>
				) : null}
			</CardContent>
		</Card>
	)
}
