'use client'

import type { RoutineLineage } from '@sunsteel/contracts'
import { GitBranch } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

import {
	describeRoutineLineage,
	lineageSourceHref,
} from '@/lib/utils/routine-lineage'

/**
 * ROUT-06. A cloned routine says so, and says who wrote the original when this
 * viewer could have read it anyway. A hidden source is stated as hidden rather
 * than omitted: staying silent would quietly present somebody else's programme
 * as original work.
 */
export function RoutineLineageNote({
	lineage,
}: {
	lineage?: RoutineLineage | null
}) {
	const t = useTranslations('routines.lineage')
	if (!lineage) return null
const href = lineageSourceHref(lineage)
	const text = describeRoutineLineage(lineage, t)

	return (
		<p className="type-body-sm flex items-center gap-2 text-ink-3">
			<GitBranch className="size-4 shrink-0" aria-hidden />
			<span>
				{text}{' '}
				{href ? (
					<Link
						href={href}
						className="text-primary underline-offset-4 hover:underline"
					>
						{t('viewOriginal')}
</Link>
				) : null}
			</span>
		</p>
	)
}
