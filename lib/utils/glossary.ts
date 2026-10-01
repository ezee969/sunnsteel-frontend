/**
 * UX-18: the training terms the app defines in place (design system §23.5).
 * Each id has a `term` and a `definition` under `core.glossary` in every
 * language; `glossary.test.ts` holds that to be true.
 */
export const GLOSSARY_TERMS = [
	'rpe',
	'rir',
	'estimated1rm',
	'progression',
	'setKinds',
	'deload',
	'trainingBlock',
	'rotation',
] as const

export type GlossaryTermId = (typeof GLOSSARY_TERMS)[number]
