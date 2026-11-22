'use client'

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { SitePhoneFrame } from './site-parts'
import { useStageStep } from './use-stage-step'

/**
 * SITE-01 §12.4, from 1024px with JavaScript: one phone held at the
 * viewport's centre while the four verb panels pass. The active verb is the
 * panel crossing the centre (an IntersectionObserver on a centre band, never
 * a scroll listener); its screen rises in and plays its script, its callout
 * follows, the rail's tick moves, and the other panels' text dims. Scrolling
 * back steps back. Under reduced motion every change is instant (the CSS
 * transitions only run with `site-anim`). Without JavaScript the stacked
 * panels, each with its own phone, are all there is.
 */
export function SiteVerbsStage({
	screens,
	callouts,
	example,
}: {
	screens: ReactNode[]
	callouts: ReactNode[]
	example: string
}) {
	const stage = useRef<HTMLDivElement>(null)
	const [active, setActive] = useState(0)
	// The first script waits for its panel to reach the centre.
	const [reached, setReached] = useState(false)

	const onStep = useCallback((step: number) => {
		setActive(step)
		setReached(true)
	}, [])
	useStageStep(
		useCallback(
			() => stage.current?.closest<HTMLElement>('.site-verbs-grid'),
			[],
		),
		'[data-verb-panel]',
		true,
		onStep,
	)

	useEffect(() => {
		const section = stage.current?.closest('section')
		section
			?.querySelectorAll<HTMLElement>('[data-verb-panel]')
			.forEach((panel, index) =>
				panel.toggleAttribute('data-dim', index !== active),
			)
	}, [active])

	const state = (index: number) =>
		index === active ? 'in' : index < active ? 'past' : 'future'

	return (
		<div ref={stage} aria-hidden="true" className="site-verbs-stage">
			<div className="site-rail">
				{screens.map((_, index) => (
					<span key={index} className="site-rail-tick" />
				))}
				<span
					className="site-rail-mark"
					style={{ transform: `translateY(${active * 100}%)` }}
				/>
			</div>
			<div className="relative">
				<SitePhoneFrame example={example}>
					{screens.map((screen, index) => (
						<div
							key={index}
							className="site-stage-screen"
							data-state={state(index)}
							data-play={reached && index === active ? '' : undefined}
						>
							{screen}
						</div>
					))}
				</SitePhoneFrame>
				{callouts.map((callout, index) => (
					<p
						key={index}
						className="site-callout site-stage-callout"
						data-state={state(index)}
					>
						{callout}
					</p>
				))}
			</div>
		</div>
	)
}
