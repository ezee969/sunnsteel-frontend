import type { Messages } from '@/messages'

import type { Locale } from './config'

// Types every `useTranslations`/`getTranslations` key against the English
// messages, so a missing or misspelled key is a `tsc` error.
declare module 'next-intl' {
	interface AppConfig {
		Locale: Locale
		Messages: Messages
	}
}
