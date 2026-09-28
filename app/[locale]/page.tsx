import { redirect } from 'next/navigation'

// The middleware answers `/` itself, by the session marker, before any page is
// chosen (I18N-01). This only stands in case it ever does not run: Login
// forwards a signed-in visitor to the dashboard anyway.
export default function HomePage() {
	redirect('/login')
}
