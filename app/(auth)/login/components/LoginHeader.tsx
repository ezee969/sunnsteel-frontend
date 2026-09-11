/**
 * The page inscription (§11.11): Cinzel over the double rule with the one pair
 * of corner brackets, on the same left axis as the form below it. It is the
 * page's single h1 (a11y review 8).
 */
export function LoginHeader() {
	return (
		<div className="rule-heading mb-8 pb-4">
			<h1 className="type-page corner-brackets inline-block text-foreground">
				Welcome Back
			</h1>
			<p className="type-body-sm mt-2 text-ink-2">
				Enter your credentials to access your account.
			</p>
		</div>
	)
}
