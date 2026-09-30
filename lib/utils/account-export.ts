import {
	accountExportFileName,
	type AccountExportV1,
} from '@sunsteel/contracts'

/**
 * EXPORT-01. How the file is written. What the Settings card says the file
 * holds lives in `settings.accountExport`. The document itself is the
 * server's (`AccountExportV1`); the browser only names it and saves it, never
 * edits it.
 */

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
