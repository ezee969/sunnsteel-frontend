import type { MuscleGroup } from '@sunsteel/contracts'

import geometry from './generated/body-map.json'

/**
 * PROG-15: the body map's figure, drawn by scripts/generate-body-map.mjs
 * (`npm run body-map:generate`) into generated/body-map.json. Path data only:
 * colour comes from the intensity tokens where it is drawn (design system §32).
 */
export interface BodyMapRegion {
	muscle: MuscleGroup
	/** Both sides of the body in one path. */
	d: string
}

export const BODY_MAP_VIEWBOX: string = geometry.viewBox
export const BODY_MAP_OUTLINE: string = geometry.outline
export const BODY_MAP_FRONT = geometry.front as readonly BodyMapRegion[]
export const BODY_MAP_BACK = geometry.back as readonly BodyMapRegion[]
/** Anatomical lines drawn as seams over the plates, never filled. */
export const BODY_MAP_FRONT_DETAILS: string = geometry.frontDetails
export const BODY_MAP_BACK_DETAILS: string = geometry.backDetails
