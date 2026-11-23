/**
 * SITE-01 §12.1: the Product panel's three columns -- features, use cases and
 * plans -- shared by the bar's dropdown (from 768) and the phone menu, so
 * the two always list the same pages. Labels are `site.topBar.columns.*`
 * and `site.topBar.links.*`.
 */
export const SITE_NAV_GROUPS = [
	{
		id: 'features',
		links: [
			['allFeatures', '/features'],
			['workoutTracker', '/features/workout-tracker'],
			['routineBuilder', '/features/routine-builder'],
			['progression', '/features/progression'],
			['progress', '/features/progress'],
			['ranks', '/features/ranks'],
			['community', '/features/community'],
		],
	},
	{
		id: 'useCases',
		links: [
			['beginners', '/use-cases/beginners'],
			['intermediates', '/use-cases/intermediates'],
			['advanced', '/use-cases/advanced'],
		],
	},
	{
		id: 'plans',
		links: [
			['pricing', '/pricing'],
			['isItFree', '/pricing#free'],
			['pro', '/pricing#pro'],
			['install', '/#install'],
		],
	},
] as const
