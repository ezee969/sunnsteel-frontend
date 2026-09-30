'use client'

import { useTranslations } from 'next-intl'
import { useCallback } from 'react'

import { apiErrorMessage } from '@/lib/utils/api-errors'

/**
 * I18N-06: `apiErrorMessage` bound to the member's language, for the toasts
 * and alerts that used to print a failed request's English `message`.
 */
export function useApiErrorMessage() {
	const t = useTranslations('core.apiErrors')
	return useCallback(
		(error: unknown, fallback?: string) => apiErrorMessage(error, t, fallback),
		[t],
	)
}
