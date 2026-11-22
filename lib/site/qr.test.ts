import QRCode from 'qrcode'
import { describe, expect, it } from 'vitest'

import { installUrl, QR_QUIET_ZONE, qrPath } from './qr'

describe('the closing band QR code (SITE-01 §12.12)', () => {
	it('opens the install helper on the environment its origin names', () => {
		expect(installUrl('https://sunnsteel.app/')).toBe(
			'https://sunnsteel.app/?install=1',
		)
		expect(installUrl('http://localhost:3000')).toBe(
			'http://localhost:3000/?install=1',
		)
	})

	it('draws one unit square per dark module inside the quiet zone', () => {
		const text = installUrl('https://sunnsteel-frontend.vercel.app')
		const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' })
		let dark = 0
		for (let index = 0; index < modules.data.length; index += 1) {
			if (modules.data[index]) dark += 1
		}
		const { path, size } = qrPath(text)
		expect(size).toBe(modules.size + 2 * QR_QUIET_ZONE)
		expect(path.match(/M/g)).toHaveLength(dark)
		// The top-left finder pattern starts at the quiet zone's edge.
		expect(path.startsWith(`M${QR_QUIET_ZONE} ${QR_QUIET_ZONE}h1v1h-1z`)).toBe(
			true,
		)
	})
})
