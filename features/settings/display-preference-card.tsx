'use client'

import { Eye } from 'lucide-react'
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
import { useDisplayPreference } from '@/hooks/use-display-preference'

/**
 * A11Y-02. Both choices are stored on this device only and apply before first
 * paint, like Motion above. Higher contrast also follows the device's own
 * setting, which this choice can add to but never turn off.
 */
export function DisplayPreferenceCard() {
	const t = useTranslations('settings.display')
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
					<CardTitle>{t('title')}</CardTitle>
				</div>
				<CardDescription>{t('description')}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="grid min-h-14 grid-cols-[minmax(0,1fr)_44px] items-center gap-3">
					<div className="space-y-1">
						<Label htmlFor="display-contrast">{t('contrast')}</Label>
						<Explanation summary={t('contrastNoteSummary')}>
							<p>{t('contrastNote')}</p>
						</Explanation>
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
							aria-label={t('contrast')}
							className="size-5"
						/>
					</Label>
				</div>
				{systemMoreContrast ? (
					<p className="type-body-sm text-ink-3" role="status">
						{t('systemContrast')}
					</p>
				) : null}
				<div className="grid min-h-14 grid-cols-[minmax(0,1fr)_44px] items-center gap-3 border-t border-rule-faint pt-3">
					<div className="space-y-1">
						<Label htmlFor="display-controls">{t('controls')}</Label>
						<Explanation summary={t('controlsNoteSummary')}>
							<p>{t('controlsNote')}</p>
						</Explanation>
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
							aria-label={t('controls')}
							className="size-5"
						/>
					</Label>
				</div>
			</CardContent>
		</Card>
	)
}
