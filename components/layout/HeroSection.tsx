import { ReactNode } from 'react'

export interface HeroSectionProps {
	title: ReactNode
	subtitle?: ReactNode
	sectionClassName?: string
	innerClassName?: string
}

/**
 * The page inscription.
 *
 * v1.0 §1.4 retires the photographic hero: the blurred column backdrop, the
 * parchment and vignette overlays and the framing corners all go, and the
 * classical identity moves into the type and the rules instead. §11.11 makes
 * this the masthead — Cinzel over a double rule, with one pair of gold corner
 * brackets, the only decorative device the direction keeps.
 *
 * It wraps to two lines below `lg` rather than truncating: Phase 5 found the
 * old fixed-width treatment cutting "Upper / Lower - Autumn Block" down to
 * "UPPER /…" at 768, which was the worst case rather than the smallest.
 *
 * `imageSrc`, `overlayGradient` and `blurPx` are gone from the API along with
 * the photograph, rather than being accepted and ignored.
 */
export const HeroSection = ({
	title,
	subtitle,
	sectionClassName = '',
	innerClassName = '',
}: HeroSectionProps) => {
	return (
		<section className={`rule-heading pb-4 ${sectionClassName}`}>
			<div className={innerClassName}>
				<h2 className="type-page corner-brackets inline-block text-foreground">
					{title}
				</h2>
				{subtitle ? (
					<p className="mt-2 max-w-[68ch] text-sm text-ink-2 sm:text-base">
						{subtitle}
					</p>
				) : null}
			</div>
		</section>
	)
}

export default HeroSection
