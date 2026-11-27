/**
 * SITE-01 §12.2: the landing headline as words, so each can rise from its own
 * mask at first paint. The message marks its carved word with `<mark>` (one
 * or more words); every word keeps the parts of it that are marked, and its
 * punctuation stays with it, so "<mark>Sunnsteel</mark>." is one word.
 */
export interface HeadlineSegment {
	text: string
	marked: boolean
}

export function headlineWords(source: string): HeadlineSegment[][] {
	let marked = false
	return source
		.split(' ')
		.filter(word => word.length > 0)
		.map(word => {
			const segments: HeadlineSegment[] = []
			for (const [index, text] of word.split(/<\/?mark>/).entries()) {
				// Every tag the split passed toggles the mark.
				if (index > 0) marked = !marked
				if (text) segments.push({ text, marked })
			}
			return segments
		})
}
