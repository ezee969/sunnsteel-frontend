/**
 * PROF-01. Where a member's avatar lives in Supabase Storage.
 *
 * Every file sits in a folder named after the member's **Supabase auth uid**,
 * never the local `User.id`: the bucket's RLS policies can only see
 * `auth.uid()`, so the folder is what lets them allow a member to write their
 * own files and nobody else's (supabase/migrations/*_avatars_bucket.sql). The
 * backend removes the same folder when an account is deleted (TRUST-01).
 *
 * Each upload gets a new name rather than overwriting one, because a public
 * URL is cached by browsers and the CDN; a new name is a new image everywhere
 * at once. The member's older files are removed after the profile points at
 * the new one.
 */
export const AVATAR_BUCKET = 'avatars'

/** The cropper's longest output side. Avatars render at most ~128px. */
export const AVATAR_MAX_PX = 512

export function avatarObjectPath(authUid: string, now: number = Date.now()) {
	return `${authUid}/${now}.jpg`
}

/**
 * The files in a member's folder other than `keepPath`, as full object paths,
 * ready to remove. `names` are what listing the folder returns: bare names.
 */
export function staleAvatarPaths(
	authUid: string,
	names: readonly string[],
	keepPath: string,
): string[] {
	return names
		.map(name => `${authUid}/${name}`)
		.filter(path => path !== keepPath)
}

/** The crop scaled down, never up, so its longest side is at most `max`. */
export function avatarOutputSize(
	width: number,
	height: number,
	max: number = AVATAR_MAX_PX,
): { width: number; height: number } {
	const longest = Math.max(width, height)
	if (longest <= max) return { width, height }
	const scale = max / longest
	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale)),
	}
}
