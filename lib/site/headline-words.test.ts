import { describe, expect, it } from 'vitest'

import en from '@/messages/en/site.json'
import es from '@/messages/es/site.json'

import { headlineWords } from './headline-words'

const plain = (text: string) => ({ text, marked: false })
const marked = (text: string) => ({ text, marked: true })

describe('headlineWords', () => {
	it('keeps the marked word and its punctuation as one word', () => {
		expect(headlineWords('Leave the math to <mark>Sunnsteel</mark>.')).toEqual([
			[plain('Leave')],
			[plain('the')],
			[plain('math')],
			[plain('to')],
			[marked('Sunnsteel'), plain('.')],
		])
	})

	it('marks every word of a mark that spans words', () => {
		expect(
			headlineWords('Las estatuas no nacen. <mark>Se esculpen</mark>.'),
		).toEqual([
			[plain('Las')],
			[plain('estatuas')],
			[plain('no')],
			[plain('nacen.')],
			[marked('Se')],
			[marked('esculpen'), plain('.')],
		])
	})

	it('reads a headline without a mark as plain words', () => {
		expect(headlineWords('Every rep.  Written down.')).toEqual([
			[plain('Every')],
			[plain('rep.')],
			[plain('Written')],
			[plain('down.')],
		])
	})

	it('reads back the same sentence in both languages', () => {
		for (const source of [en.hero.headline, es.hero.headline]) {
			const words = headlineWords(source)
			const text = words
				.map(word => word.map(segment => segment.text).join(''))
				.join(' ')
			expect(text).toBe(source.replace(/<\/?mark>/g, ''))
			expect(words.flat().some(segment => segment.marked)).toBe(true)
		}
	})
})
