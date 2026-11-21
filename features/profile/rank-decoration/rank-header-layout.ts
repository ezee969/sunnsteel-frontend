/**
 * The rank-decorated profile header's spacing (ACH-11, design system §24),
 * shared by the profile and the public site's header mock (SITE-01 §12.7),
 * so the mock is laid out exactly as a profile is.
 */

/**
 * ACH-11 (§24.2): the room each rank's frame and portrait ornament take. The
 * frame answers to the header's own width (its compact pieces sit below
 * 600px), the portrait to the avatar, which grows from the same 600px. A decorated header
 * puts the portrait beside the text only from 860px of its own width: below
 * that the frame and the ornament leave the text column too narrow, so it
 * stacks as it does on a phone.
 */
export const RANK_HEADER_PADDING = [
	'pb-8',
	'pb-11',
	'px-[22px] pt-[26px] pb-9 @min-[600px]:px-[34px] @min-[600px]:pt-[34px] @min-[600px]:pb-11',
	'px-[22px] pt-10 pb-10 @min-[600px]:px-11 @min-[600px]:pt-[60px] @min-[600px]:pb-[50px]',
	'px-[22px] pt-[66px] pb-[46px] @min-[600px]:px-[46px] @min-[600px]:pt-20 @min-[600px]:pb-[58px]',
	// v1.1: below 600px Laureate's border band reaches 28px in, so a 30px
	// inset put the name's bracket on the inner rule; 42px gives it the room
	// the other ranks have.
	'px-[42px] pt-[70px] pb-[50px] @min-[600px]:px-[60px] @min-[600px]:pt-[92px] @min-[600px]:pb-[66px]',
] as const
/**
 * v1.1: the Artisan knots and Maestro scrolls are large enough to reach the
 * header's actions -- the knot was drawn over "Share profile" at 1440. The
 * actions keep clear of the corner they sit beside: above it while the
 * header is a column, left of it once it is a row (from 860px). The other
 * ranks' corners are small enough not to need it.
 */
export const RANK_ACTIONS_CLEARANCE = [
	'',
	'',
	'mb-9 @min-[600px]:mb-12 @min-[860px]:mb-0 @min-[860px]:mr-16',
	'mb-7 @min-[600px]:mb-10 @min-[860px]:mb-0 @min-[860px]:mr-[100px]',
	'',
	'',
] as const
/**
 * The portrait's ornament overflows the avatar in proportion to it, so its
 * margin scales with the avatar: 64px below a 600px header, 96px from it.
 */
export const RANK_PORTRAIT_MARGIN = [
	'm-1 @min-[600px]:m-1.5',
	'm-1.5 @min-[600px]:m-2.5',
	'm-2.5 @min-[600px]:m-3.5',
	'mx-4 mt-4 mb-6.5 @min-[600px]:mx-6 @min-[600px]:mt-6 @min-[600px]:mb-8 @min-[860px]:mb-0',
	'mx-5 mt-5.5 mb-6.5 @min-[600px]:mx-7 @min-[600px]:mt-7 @min-[600px]:mb-8 @min-[860px]:mb-0',
	'mx-7 mt-8 mb-8 @min-[600px]:mx-[46px] @min-[600px]:mt-[46px] @min-[600px]:mb-10 @min-[860px]:mb-0',
] as const
/**
 * Below a 600px header your own profile's one action, Share, sits beside the
 * portrait, so the counts are the column's last row and keep clear of the
 * corners the actions used to sit above.
 */
export const RANK_COMPACT_TEXT_CLEARANCE = [
	'',
	'',
	'@max-[600px]:pb-7',
	'@max-[600px]:pb-5',
	'',
	'',
] as const
