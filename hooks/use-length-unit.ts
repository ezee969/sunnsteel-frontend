import type { LengthUnit } from '@sunsteel/contracts'

import { useUser } from '@/lib/api/hooks/useUser'

/**
 * PREF-04: the unit the member reads and types lengths in, from their
 * profile; centimetres until it has loaded or when it was never chosen.
 */
export function useLengthUnit(): LengthUnit {
	const { user } = useUser()
	return user?.lengthUnit ?? 'CM'
}
