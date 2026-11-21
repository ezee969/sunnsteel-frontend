'use client'

import { useLocale } from 'next-intl'

import { type Locale, LOCALES } from '@/i18n/config'
import { writeLocaleCookie } from '@/i18n/locale-cookie'
import { cn } from '@/lib/utils'

/**
 * SITE-01 §12.1: EN · ES. Each language is its own static build, so choosing
 * one writes the cookie the middleware reads and reloads the same page. The
 * current language is underlined and `aria-current`, never told by colour.
 */
export function LanguageSwitch({
	label,
	names,
}: {
	label: string
	names: Record<Locale, string>
}) {
	const current = useLocale()
	return (
		<ul aria-label={label} className="flex items-center gap-1.5">
			{LOCALES.map((locale, index) => (
				<li key={locale} className="flex items-center gap-1.5">
					{index > 0 ? (
						<span aria-hidden="true" className="text-ink-3">
							·
						</span>
					) : null}
					<button
						type="button"
						lang={locale}
						aria-label={names[locale]}
						aria-current={locale === current ? 'true' : undefined}
						onClick={() => {
							if (locale === current) return
							writeLocaleCookie(locale)
							window.location.reload()
						}}
						className={cn(
							'type-label text-ink-3 hover:text-foreground',
							locale === current &&
								'text-foreground underline underline-offset-[5px]',
						)}
					>
						{locale.toUpperCase()}
					</button>
				</li>
			))}
		</ul>
	)
}
