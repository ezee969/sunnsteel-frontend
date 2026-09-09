import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface HeroCardProps {
	title: string
	description: string
	primaryAction: {
		text: string
		onClick: () => void
	}
	secondaryAction?: {
		text: string
		onClick: () => void
	}
	progressPercentage?: number
}

/**
 * A panel with a headline, a primary action and an optional completion dial.
 *
 * v1.0 §4.3 rule 6 retires the ink gradient this used to be painted with, §8
 * retires its drop shadow, and §11.11 allows one pair of corner brackets per
 * screen — which the page masthead now owns — so the `OrnateCorners` frame is
 * gone from here. The dial is drawn in `--rule` and `--foreground` instead of
 * hardcoded whites, so it survives both themes.
 *
 * Note: this component currently has no importers. It is restyled rather than
 * deleted because deletion is Phase 15's call, not this batch's.
 */
export default function HeroCard({
	title,
	description,
	primaryAction,
	secondaryAction,
	progressPercentage,
}: HeroCardProps) {
	return (
		<Card>
			<CardContent className="p-4 sm:p-8">
				<div className="grid gap-6 md:grid-cols-2">
					<div className="space-y-3 sm:space-y-4">
						<h2 className="type-section text-foreground">{title}</h2>
						<p className="type-body-sm text-ink-2">{description}</p>
						<div className="flex gap-2 sm:gap-3">
							<Button variant="default" onClick={primaryAction.onClick}>
								{primaryAction.text}
							</Button>
							{secondaryAction && (
								<Button variant="outline" onClick={secondaryAction.onClick}>
									{secondaryAction.text}
								</Button>
							)}
						</div>
					</div>
					{progressPercentage !== undefined && (
						<div className="hidden items-center justify-center sm:flex">
							<div className="relative h-24 w-24 sm:h-32 sm:w-32">
								<svg viewBox="0 0 100 100" className="h-full w-full">
									<circle
										cx="50"
										cy="50"
										r="40"
										fill="none"
										stroke="var(--rule)"
										strokeWidth="6"
									/>
									<circle
										cx="50"
										cy="50"
										r="40"
										fill="none"
										stroke="var(--foreground)"
										strokeWidth="6"
										strokeDasharray="251.2"
										strokeDashoffset={251.2 * (1 - progressPercentage / 100)}
										transform="rotate(-90 50 50)"
									/>
								</svg>
								<div className="absolute inset-0 flex flex-col items-center justify-center">
									<span className="type-numeral text-foreground">
										{progressPercentage}%
									</span>
									<span className="type-body-sm text-ink-3">Completed</span>
								</div>
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
