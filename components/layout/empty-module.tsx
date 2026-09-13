import Link from 'next/link'

import { Button } from '@/components/ui/button'
import type { EmptyStateCopy } from '@/lib/utils/empty-states'

type EmptyModuleProps = EmptyStateCopy & {
	/** Required when the action is `clear-filters`. */
	onClearFilters?: () => void
}

/**
 * DASH-10's empty module: a short statement, why it is empty, and the next
 * step. It sits on the module's ruled ground (§11.5) with no placeholder box,
 * and its action is outline because the region's primary lives elsewhere
 * (§4.3 rule 1).
 */
export function EmptyModule({
	title,
	description,
	action,
	onClearFilters,
}: EmptyModuleProps) {
	return (
		<div className="max-w-[68ch] space-y-1 py-3">
			<p className="type-panel text-foreground">{title}</p>
			<p className="type-body-sm text-ink-3">{description}</p>
			{action ? (
				<div className="pt-2">
					{action.kind === 'link' ? (
						<Button asChild variant="outline" size="sm">
							<Link href={action.href}>{action.label}</Link>
						</Button>
					) : (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onClearFilters}
						>
							{action.label}
						</Button>
					)}
				</div>
			) : null}
		</div>
	)
}
