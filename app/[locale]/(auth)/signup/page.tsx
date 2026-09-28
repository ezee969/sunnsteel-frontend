'use client'

import { SignupHeader } from './components/SignupHeader'
import { SupabaseSignupForm } from './components/SupabaseSignupForm'

// §9.2: no page-level entrance animation.
export default function SignupPage() {
	return (
		<div>
			<SignupHeader />
			<SupabaseSignupForm />
		</div>
	)
}
