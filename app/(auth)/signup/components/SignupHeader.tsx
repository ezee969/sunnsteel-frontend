/**
 * The page inscription (§11.11): Cinzel over the double rule with the one pair
 * of corner brackets, on the same left axis as the form below it. It is the
 * page's single h1 (a11y review 8).
 */
export function SignupHeader() {
	return (
		<div className="rule-heading mb-8 pb-4">
			<h1 className="type-page corner-brackets inline-block text-foreground">
				Create Account
			</h1>
			<p className="type-body-sm mt-2 text-ink-2">
				Join the elite and begin your journey.
			</p>
		</div>
	)
}
