import { notFound } from 'next/navigation'

// I18N-01: every page lives under `[locale]`, so an address that matches none
// of them lands here and renders `[locale]/not-found.tsx` inside the app's own
// layout, in the visitor's language, instead of Next's bare default.
export default function CatchAll() {
	notFound()
}
