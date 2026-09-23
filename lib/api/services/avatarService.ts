import { supabase } from '@/lib/supabase/client'
import {
	AVATAR_BUCKET,
	avatarObjectPath,
	staleAvatarPaths,
} from '@/lib/utils/avatar-storage'

/**
 * PROF-01: the one place the app talks to Supabase Storage. The upload goes
 * straight from the browser to Storage under the member's own session, which
 * the bucket's RLS policies check; the backend only stores the resulting URL.
 */
export const avatarService = {
	async upload(file: File): Promise<{ path: string; publicUrl: string }> {
		const {
			data: { session },
		} = await supabase.auth.getSession()
		const authUid = session?.user.id
		if (!authUid) {
			throw new Error(
				'Your session has ended. Sign in again to change your photo.',
			)
		}

		const path = avatarObjectPath(authUid)
		const bucket = supabase.storage.from(AVATAR_BUCKET)
		const { error } = await bucket.upload(path, file, {
			contentType: file.type || 'image/jpeg',
			// The name never changes meaning, so it can be cached for a year.
			cacheControl: '31536000',
			upsert: false,
		})
		if (error) {
			throw new Error(`Your photo could not be uploaded: ${error.message}`)
		}
		return { path, publicUrl: bucket.getPublicUrl(path).data.publicUrl }
	},

	/**
	 * Remove the member's other files once the profile points at `keepPath`.
	 * Best effort: a leftover file costs storage, not correctness, and the
	 * whole folder goes when the account is deleted.
	 */
	async removeOthers(keepPath: string): Promise<void> {
		const authUid = keepPath.split('/')[0]
		const bucket = supabase.storage.from(AVATAR_BUCKET)
		const { data, error } = await bucket.list(authUid, { limit: 100 })
		if (error || !data) return
		const stale = staleAvatarPaths(
			authUid,
			data.map(object => object.name),
			keepPath,
		)
		if (stale.length) await bucket.remove(stale)
	},

	/** Undo an upload whose profile update failed, so nothing is orphaned. */
	async remove(path: string): Promise<void> {
		await supabase.storage.from(AVATAR_BUCKET).remove([path])
	},
}
