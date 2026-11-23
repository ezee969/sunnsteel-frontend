'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
	type CSSProperties,
	type KeyboardEvent,
	type PointerEvent,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from 'react'

import { ToggleOption, ToggleRow } from '@/components/ui/toggle-row'

import { prefersStill } from './site-motion'

/**
 * SITE-01 §12.8: the templates by level. Without JavaScript the server's
 * plain list stands (every card in level order). With it: the
 * level tabs (the app's ToggleRow) over a coverflow from 768 -- the front
 * card full size with the region's filled action, its neighbours at 85% and
 * 60% opacity, reached by their own "Show <name>" control, the previous and
 * next buttons naming what they bring forward, the arrow keys and a swipe --
 * and a scroll-snap row on phones and under reduced motion. A polite live
 * region says which card is in front.
 */
export interface TemplateCard {
	id: string
	/** The level it belongs to. */
	level: 'beginner' | 'intermediate' | 'advanced'
	name: string
	node: ReactNode
}

type Layout = 'list' | 'flow' | 'row'
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const
type Level = (typeof LEVELS)[number]

const inert = (on: boolean) => (on ? ({ inert: true } as object) : {})

export function SiteTemplateCarousel({ cards }: { cards: TemplateCard[] }) {
	const t = useTranslations('site.templates')
	const [layout, setLayout] = useState<Layout>('list')
	const [level, setLevel] = useState<Level>('beginner')
	const [front, setFront] = useState(0)
	const row = useRef<HTMLUListElement>(null)
	const swipe = useRef<number | null>(null)

	useEffect(() => {
		const wide = window.matchMedia('(min-width: 768px)')
		const choose = () =>
			setLayout(wide.matches && !prefersStill() ? 'flow' : 'row')
		choose()
		wide.addEventListener('change', choose)
		return () => wide.removeEventListener('change', choose)
	}, [])

	const shown = cards.filter(card => card.level === level)
	const last = shown.length - 1
	const go = (index: number) => {
		const next = Math.max(0, Math.min(last, index))
		setFront(next)
		if (layout === 'row') {
			row.current?.children[next]?.scrollIntoView({
				behavior: prefersStill() ? 'auto' : 'smooth',
				block: 'nearest',
				inline: 'center',
			})
		}
	}

	// Phones: the snapped card is the front one.
	useEffect(() => {
		if (layout !== 'row' || !row.current) return
		const items = Array.from(row.current.children)
		const snap = new IntersectionObserver(
			entries => {
				for (const entry of entries) {
					if (entry.isIntersecting) setFront(items.indexOf(entry.target))
				}
			},
			// The card crossing the row's centre line is the front one; with
			// several fully in view (a wide screen) a share would pick the last.
			{ root: row.current, rootMargin: '0px -50% 0px -50%' },
		)
		items.forEach(item => snap.observe(item))
		return () => snap.disconnect()
	}, [layout, level])

	if (layout === 'list') {
		return (
			<ul className="site-templates">
				{cards.map(card => (
					<li key={card.id}>{card.node}</li>
				))}
			</ul>
		)
	}

	const onKey = (event: KeyboardEvent) => {
		if (event.key === 'ArrowRight') go(front + 1)
		else if (event.key === 'ArrowLeft') go(front - 1)
		else return
		event.preventDefault()
	}
	const onPointerDown = (event: PointerEvent) => {
		swipe.current = event.clientX
	}
	const onPointerUp = (event: PointerEvent) => {
		if (swipe.current === null) return
		const delta = event.clientX - swipe.current
		swipe.current = null
		if (Math.abs(delta) > 40) go(front + (delta < 0 ? 1 : -1))
	}

	const place = (index: number): CSSProperties => {
		if (layout !== 'flow') return {}
		const offset = index - front
		const distance = Math.abs(offset)
		return {
			transform: `translateX(${offset * 62}%) scale(${distance === 0 ? 1 : 0.85})`,
			opacity: distance === 0 ? 1 : distance === 1 ? 0.6 : 0,
			zIndex: 10 - distance,
			visibility: distance > 1 ? 'hidden' : undefined,
		}
	}

	return (
		<div className="site-coverflow-wrap">
			<ToggleRow aria-label={t('levelsLabel')} className="site-levels">
				{LEVELS.map(option => (
					<ToggleOption
						key={option}
						pressed={level === option}
						onClick={() => {
							setLevel(option)
							setFront(0)
						}}
					>
						{t(`levels.${option}`)}
					</ToggleOption>
				))}
			</ToggleRow>
			<div
				className="site-coverflow"
				data-layout={layout}
				onKeyDown={onKey}
				onPointerDown={layout === 'flow' ? onPointerDown : undefined}
				onPointerUp={layout === 'flow' ? onPointerUp : undefined}
			>
				{layout === 'flow' ? (
					<button
						type="button"
						className="site-coverflow-arrow"
						data-side="previous"
						disabled={front === 0}
						aria-label={
							front > 0
								? t('show', { name: shown[front - 1].name })
								: t('previous')
						}
						onClick={() => go(front - 1)}
					>
						<ChevronLeft className="size-5" aria-hidden />
					</button>
				) : null}
				<ul ref={row} key={level} className="site-coverflow-track">
					{shown.map((card, index) => (
						<li
							key={card.id}
							className="site-coverflow-card"
							data-front={index === front || undefined}
							style={place(index)}
						>
							<div {...inert(layout === 'flow' && index !== front)}>
								{card.node}
							</div>
							{layout === 'flow' && Math.abs(index - front) === 1 ? (
								<button
									type="button"
									className="site-coverflow-show"
									aria-label={t('show', { name: card.name })}
									onClick={() => go(index)}
								/>
							) : null}
						</li>
					))}
				</ul>
				{layout === 'flow' ? (
					<button
						type="button"
						className="site-coverflow-arrow"
						data-side="next"
						disabled={front === last}
						aria-label={
							front < last
								? t('show', { name: shown[front + 1].name })
								: t('next')
						}
						onClick={() => go(front + 1)}
					>
						<ChevronRight className="size-5" aria-hidden />
					</button>
				) : null}
			</div>
			<p aria-live="polite" className="sr-only">
				{t('position', {
					name: shown[front]?.name ?? '',
					position: front + 1,
					total: shown.length,
				})}
			</p>
		</div>
	)
}
