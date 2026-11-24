import type { MetadataRoute } from 'next'

import { FEATURE_SLUGS } from '@/features/site/pages/feature-page'
import { USE_CASE_SLUGS } from '@/features/site/pages/use-case-page'
import { PUBLIC_ORIGIN } from '@/lib/config/env'
import { siteLandingLive } from '@/lib/site/landing'

/**
 * SITE-01 §12.14: every public page, once the site is launched. The language
 * is never in the address (I18N-01), so each page is listed once.
 */
export default function sitemap(): MetadataRoute.Sitemap {
	if (!PUBLIC_ORIGIN || !siteLandingLive()) return []
	const paths = [
		'/',
		'/features',
		...FEATURE_SLUGS.map(slug => `/features/${slug}`),
		...USE_CASE_SLUGS.map(level => `/use-cases/${level}`),
		'/pricing',
	]
	return paths.map(path => ({
		url: `${PUBLIC_ORIGIN}${path}`,
		changeFrequency: 'monthly',
		priority: path === '/' ? 1 : 0.7,
	}))
}
