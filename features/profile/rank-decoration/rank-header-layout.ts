/**
 * The rank-decorated profile header's spacing (ACH-11, design system §24),
 * shared by the profile and the public site's header mock (SITE-01 §12.7),
 * so the mock is laid out exactly as a profile is.
 *
 * §24.8 (2026-11-23, the owner): every rank's header takes the same height.
 * The vertical room is therefore one for all six ranks -- each slot takes the
 * most any rank needs, so a header is as tall as the tallest rank would make
 * it, and changing rank never moves the name. Only the horizontal room is the
 * rank's own; a rank whose ornament is small leaves the rest of the room
 * empty rather than drawing the header shorter.
 *
 * The frame answers to the header's own width (its compact pieces sit below
 * 600px), the portrait to the avatar, which grows from the same 600px. A
 * decorated header puts the portrait beside the text only from 860px of its
 * own width: below that the frame and the ornament leave the text column too
 * narrow, so it stacks as it does on a phone.
 */

/**
 * The header's top and foot. The top is Laureate's (its head cartouche and
 * border band are the deepest); the foot is Artisan's, whose bottom knots
 * reach furthest in, measured from the last row while the header is a column
 * (actions, or on your own phone-width profile the counts) -- the room the
 * former per-rank clearances gave it. From 860px the actions sit beside the
 * text, so the foot is Laureate's again.
 */
const HEADER_BLOCK =
	'pt-[70px] pb-[72px] @min-[600px]:pt-[92px] @min-[600px]:pb-[92px] @min-[860px]:pb-[66px]'

/** The rank's own left and right room: its border band and corner pieces. */
export const RANK_HEADER_PADDING = [
	HEADER_BLOCK,
	HEADER_BLOCK,
	`${HEADER_BLOCK} px-[22px] @min-[600px]:px-[34px]`,
	`${HEADER_BLOCK} px-[22px] @min-[600px]:px-11`,
	`${HEADER_BLOCK} px-[22px] @min-[600px]:px-[46px]`,
	// v1.1: below 600px Laureate's border band reaches 28px in, so a 30px
	// inset put the name's bracket on the inner rule; 42px gives it the room
	// the other ranks have.
	`${HEADER_BLOCK} px-[42px] @min-[600px]:px-[60px]`,
] as const

/**
 * v1.1: the Artisan knots and Maestro scrolls are large enough to reach the
 * header's actions -- the knot was drawn over "Share profile" at 1440. Once
 * the header is a row (from 860px) the actions keep left of the corner they
 * sit beside; while it is a column the shared foot keeps them above it. The
 * other ranks' corners are small enough not to need it.
 */
export const RANK_ACTIONS_CLEARANCE = [
	'',
	'',
	'@min-[860px]:mr-16',
	'@min-[860px]:mr-[100px]',
	'',
	'',
] as const

/**
 * The portrait's ornament overflows the avatar in proportion to it, so its
 * margin scales with the avatar: 64px below a 600px header, 96px from it. Its
 * top and foot are Laureate's (the aureole and ribbons) for every rank; its
 * sides are the rank's own ornament.
 */
const PORTRAIT_BLOCK =
	'mt-8 mb-8 @min-[600px]:mt-[46px] @min-[600px]:mb-10 @min-[860px]:mb-0'

export const RANK_PORTRAIT_MARGIN = [
	`${PORTRAIT_BLOCK} mx-1 @min-[600px]:mx-1.5`,
	`${PORTRAIT_BLOCK} mx-1.5 @min-[600px]:mx-2.5`,
	`${PORTRAIT_BLOCK} mx-2.5 @min-[600px]:mx-3.5`,
	`${PORTRAIT_BLOCK} mx-4 @min-[600px]:mx-6`,
	`${PORTRAIT_BLOCK} mx-5 @min-[600px]:mx-7`,
	`${PORTRAIT_BLOCK} mx-7 @min-[600px]:mx-[46px]`,
] as const
