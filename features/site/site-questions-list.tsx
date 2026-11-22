'use client'

import { type ReactNode, useEffect, useState } from 'react'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'

/**
 * SITE-01 §12.11: the questions as the app's ruled accordion, several open at
 * once. An anchor that names a question (`/#install`, `/#free`) opens it when
 * the page loads on it or the address changes to it.
 */
export function SiteQuestionsList({
	items,
}: {
	items: { id: string; question: string; answer: ReactNode }[]
}) {
	const [open, setOpen] = useState<string[]>([])

	useEffect(() => {
		const follow = () => {
			const id = window.location.hash.slice(1)
			if (!items.some(item => item.id === id)) return
			setOpen(current => (current.includes(id) ? current : [...current, id]))
			document.getElementById(id)?.scrollIntoView({ block: 'start' })
		}
		follow()
		window.addEventListener('hashchange', follow)
		return () => window.removeEventListener('hashchange', follow)
	}, [items])

	return (
		<Accordion
			type="multiple"
			value={open}
			onValueChange={setOpen}
			className="site-questions-list"
		>
			{items.map(item => (
				<AccordionItem
					key={item.id}
					id={item.id}
					value={item.id}
					className="border-rule-faint"
				>
					<AccordionTrigger className="min-h-11">
						{item.question}
					</AccordionTrigger>
					<AccordionContent>
						<p className="type-body max-w-[64ch] text-ink-2">{item.answer}</p>
					</AccordionContent>
				</AccordionItem>
			))}
		</Accordion>
	)
}
