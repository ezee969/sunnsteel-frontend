import type { WeightUnit } from '@sunsteel/contracts'

import { useUser } from '@/lib/api/hooks/useUser'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

export function useWeightUnit(): WeightUnit {
	const { user } = useUser()
	const { user: authenticatedUser } = useSupabaseAuth()
	return user?.weightUnit ?? authenticatedUser?.weightUnit ?? 'KG'
}
