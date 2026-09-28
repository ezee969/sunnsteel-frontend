import { parse, TYPE } from '@formatjs/icu-messageformat-parser'
import { describe, expect, it } from 'vitest'

import { LOCALES } from '@/i18n/config'

import { MESSAGES } from '.'

type Tree = { [key: string]: string | Tree }

function leaves(tree: Tree, prefix = ''): Map<string, string> {
	const out = new Map<string, string>()
	for (const [key, value] of Object.entries(tree)) {
		const path = prefix ? `${prefix}.${key}` : key
		if (typeof value === 'string') out.set(path, value)
		else for (const [p, v] of leaves(value, path)) out.set(p, v)
	}
	return out
}

/** Every `{argument}` a message reads, however deep in a plural or select. */
function argumentsOf(message: string): string[] {
	const names = new Set<string>()
	const walk = (nodes: ReturnType<typeof parse>) => {
		for (const node of nodes) {
			if ('value' in node && node.type !== TYPE.literal)
				names.add(String(node.value))
			if ('options' in node)
				for (const option of Object.values(node.options)) walk(option.value)
			if ('children' in node) walk(node.children)
		}
	}
	walk(parse(message))
	return [...names].sort()
}

const english = leaves(MESSAGES.en as unknown as Tree)

describe('messages (I18N-01)', () => {
	it.each(LOCALES.filter(locale => locale !== 'en'))(
		'%s has exactly the English keys',
		locale => {
			const other = leaves(MESSAGES[locale] as unknown as Tree)
			expect([...other.keys()].sort()).toEqual([...english.keys()].sort())
		},
	)

	it.each(LOCALES.filter(locale => locale !== 'en'))(
		'%s reads the same arguments as English in every message',
		locale => {
			const other = leaves(MESSAGES[locale] as unknown as Tree)
			for (const [key, message] of english) {
				expect({ key, args: argumentsOf(other.get(key) ?? '') }).toEqual({
					key,
					args: argumentsOf(message),
				})
			}
		},
	)

	it.each(LOCALES)('%s has no empty message', locale => {
		for (const [key, message] of leaves(MESSAGES[locale] as unknown as Tree))
			expect({ key, empty: message.trim() === '' }).toEqual({
				key,
				empty: false,
			})
	})
})
