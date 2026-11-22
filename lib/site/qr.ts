import QRCode from 'qrcode'

/**
 * SITE-01 §12.12: the closing band's QR code as SVG path data, worked out on
 * the server when the page is rendered, so the visitor downloads no QR
 * library. Each dark module is one unit square; the four-module quiet zone
 * the format needs is part of the view box.
 */
export const QR_QUIET_ZONE = 4

export function qrPath(text: string): { path: string; size: number } {
	const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' })
	const parts: string[] = []
	for (let row = 0; row < modules.size; row += 1) {
		for (let column = 0; column < modules.size; column += 1) {
			if (modules.get(row, column)) {
				parts.push(`M${column + QR_QUIET_ZONE} ${row + QR_QUIET_ZONE}h1v1h-1z`)
			}
		}
	}
	return { path: parts.join(''), size: modules.size + 2 * QR_QUIET_ZONE }
}

/** Where the code sends a phone: the landing, with its install helper. */
export function installUrl(origin: string): string {
	return `${origin.replace(/\/+$/, '')}/?install=1`
}
