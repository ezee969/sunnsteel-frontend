import {
	type _Translator,
	createTranslator,
	type NamespaceKeys,
	type NestedKeyOf,
} from 'next-intl'

import type { Messages } from '@/messages'
import { MESSAGES } from '@/messages'

import type { Locale } from './config'

type Namespace = NamespaceKeys<Messages, NestedKeyOf<Messages>>

/**
 * I18N-01: what a pure copy function receives instead of returning English.
 * A component passes `useTranslations('<namespace>')`; a test passes
 * `translatorFor(locale, '<namespace>')`, so the copy rules a module is tested
 * for hold in every language rather than in English only.
 */
export type Translator<N extends Namespace> = _Translator<Messages, N>

/** A translator outside React, for tests and other pure callers. */
export function translatorFor<const N extends Namespace>(
	locale: Locale,
	namespace: N,
) {
	return createTranslator({
		locale,
		messages: MESSAGES[locale],
		namespace,
	}) as unknown as Translator<N>
}
