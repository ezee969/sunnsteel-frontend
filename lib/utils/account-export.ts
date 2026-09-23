import {
	accountExportFileName,
	type AccountExportV1,
} from '@sunsteel/contracts'

/**
 * EXPORT-01. What the Settings card says the file holds, and how the file is
 * written. The document itself is the server's (`AccountExportV1`); the
 * browser only names it and saves it, never edits it.
 */
export const ACCOUNT_EXPORT_CONTENTS =
	'One JSON file with your profile and settings, every routine and its saved versions, every workout with its sets, your records, goals, gym equipment, schedule changes, starred exercises, who you follow and train with, and the comments, reactions and reports you made.'

export const ACCOUNT_EXPORT_NOTES =
	'Weights are in kilograms, as Sunnsteel stores them. Other members appear by username only, and links you shared and devices you enabled are left out, because they work as keys.'

/** The file a download saves: its name, and the document as readable JSON. */
export function accountExportFile(data: AccountExportV1): {
	fileName: string
	contents: string
} {
	return {
		fileName: accountExportFileName(data.account.username, data.exportedAt),
		contents: `${JSON.stringify(data, null, 2)}\n`,
	}
}
