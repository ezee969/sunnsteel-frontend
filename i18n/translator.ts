import {
	type _Translator,
	createTranslator,
	type MessageKeys,
	type NamespaceKeys,
	type NestedKeyOf,
	type NestedValueOf,
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

/**
 * The keys of one namespace, for a module that looks a label up from a stable
 * value: `Record<SetKind, MessageKey<'routines.sets'>>` keeps the map honest,
 * where the translator's own parameter type widens to every key in every
 * namespace and stops narrowing the call.
 */
export type MessageKey<N extends Namespace> = MessageKeys<
	NestedValueOf<Messages, N>,
	NestedKeyOf<NestedValueOf<Messages, N>>
>

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
