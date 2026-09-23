import { describe, expect, it } from 'vitest'

import {
	AVATAR_MAX_PX,
	avatarObjectPath,
	avatarOutputSize,
	staleAvatarPaths,
} from './avatar-storage'

const UID = '3bbf4c7b-e874-49eb-98a5-aaca79dbf5db'

describe('PROF-01 avatar storage', () => {
	it('puts every upload in the folder named after the auth uid', () => {
		expect(avatarObjectPath(UID, 1790159431974)).toBe(
			`${UID}/1790159431974.jpg`,
		)
		const [folder, name] = avatarObjectPath(UID).split('/')
		expect(folder).toBe(UID)
		expect(name).toMatch(/^\d+\.jpg$/)
	})

	it('lists the older files of the folder for removal, never the new one', () => {
		const keep = `${UID}/3.jpg`
		expect(staleAvatarPaths(UID, ['1.jpg', '2.jpg', '3.jpg'], keep)).toEqual([
			`${UID}/1.jpg`,
			`${UID}/2.jpg`,
		])
		expect(staleAvatarPaths(UID, ['3.jpg'], keep)).toEqual([])
	})

	it('scales a large crop down to the cap and never scales a small one up', () => {
		expect(avatarOutputSize(3024, 3024)).toEqual({
			width: AVATAR_MAX_PX,
			height: AVATAR_MAX_PX,
		})
		expect(avatarOutputSize(2000, 1000)).toEqual({ width: 512, height: 256 })
		expect(avatarOutputSize(300, 300)).toEqual({ width: 300, height: 300 })
	})
})
