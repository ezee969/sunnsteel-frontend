'use client'

import type { AppLocale } from '@sunsteel/contracts'
import { Languages, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { useToast } from '@/components/ui/toast'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { isLocale, LOCALES } from '@/i18n/config'
import { useUpdateLocale } from '@/lib/api/hooks/useUpdateLocale'

const DEVICE = 'DEVICE'

/**
 * I18N-02. Stored on the account, so every device and every push
 * notification (I18N-06) follows it; "Match this device" stores nothing and
 * lets each browser's own language decide. Each language names itself, in
 * its own words, so it can be found by someone who cannot read the other.
 */
export function LanguagePreferenceCard({
	locale,
}: {
	locale: AppLocale | null | undefined
}) {
	const errorText = useApiErrorMessage()
	const t = useTranslations('core.language')
	const { push } = useToast()
	const update = useUpdateLocale()
	const id = 'account-language'

	const onChange = (value: string) => {
		update.mutate(isLocale(value) ? value : null, {
			onError: error =>
				push({
					title: t('failed'),
					description: errorText(error),
					variant: 'destructive',
				}),
		})
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<Languages className="h-5 w-5 text-primary" aria-hidden />
					<CardTitle>{t('title')}</CardTitle>
				</div>
				<CardDescription>{t('description')}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-2">
				<Label htmlFor={id}>{t('label')}</Label>
				<div className="flex items-center gap-2">
					<NativeSelect
						id={id}
						className="w-full sm:max-w-xs"
						value={locale ?? DEVICE}
						disabled={update.isPending}
						onChange={event => onChange(event.target.value)}
					>
						<option value={DEVICE}>{t('device')}</option>
						{LOCALES.map(option => (
							<option key={option} value={option} lang={option}>
								{t(`name.${option}`)}
							</option>
						))}
					</NativeSelect>
					{update.isPending ? (
						<Loader2
							className="size-4 shrink-0 animate-spin text-ink-3"
							aria-label={t('saving')}
						/>
					) : null}
				</div>
			</CardContent>
		</Card>
	)
}
