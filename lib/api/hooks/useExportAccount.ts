import type { AccountExportV1 } from '@sunsteel/contracts'
import { useMutation } from '@tanstack/react-query'

import { userService } from '@/lib/api/services/userService'
import { accountExportFile } from '@/lib/utils/account-export'

/**
 * EXPORT-01: fetch the export and save it. The request needs the bearer
 * token, so it cannot be a plain link; the document is turned into a Blob and
 * handed to the browser's download, then the object URL is released.
 */
export function useExportAccount() {
	return useMutation<AccountExportV1, Error, void>({
		mutationFn: () => userService.exportAccount(),
		onSuccess: data => {
			const { fileName, contents } = accountExportFile(data)
			const url = URL.createObjectURL(
				new Blob([contents], { type: 'application/json' }),
			)
			const link = document.createElement('a')
			link.href = url
			link.download = fileName
			document.body.appendChild(link)
			link.click()
			link.remove()
			setTimeout(() => URL.revokeObjectURL(url), 0)
		},
	})
}
