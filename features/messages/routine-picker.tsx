'use client'

import { ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useRoutines } from '@/lib/api/hooks/useRoutines'
import { sendableRoutines } from '@/lib/utils/messages'

/**
 * MSG-07: the member's own routines, one of which travels with a message.
 * It says what sending one does before anything is chosen: the other member
 * may open and copy it whatever its visibility, until the message is deleted.
 * A routine moderation hid is never offered, because the server refuses it.
 */
export function RoutinePicker({
	open,
	onOpenChange,
	onChoose,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	onChoose: (routine: { id: string; name: string }) => void
}) {
	const t = useTranslations('messaging.composer')
	const routines = useRoutines()
	const choices = sendableRoutines(routines.data ?? [])

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('pickerTitle')}</DialogTitle>
					<DialogDescription>{t('pickerDescription')}</DialogDescription>
				</DialogHeader>
				{routines.isPending ? (
					<div aria-busy="true" aria-label={t('pickerLoading')}>
						<Skeleton className="h-11" />
						<Skeleton className="mt-2 h-11" />
					</div>
				) : choices.length === 0 ? (
					<p className="type-body-sm text-ink-3">{t('pickerEmpty')}</p>
				) : (
					<ul className="max-h-[50vh] overflow-y-auto border-t border-rule-faint">
						{choices.map(routine => (
							<li key={routine.id} className="rule-row">
								<button
									type="button"
									className="group flex min-h-11 w-full items-center justify-between gap-2 rounded-sm py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
									aria-label={t('pickerChoose', { name: routine.name })}
									onClick={() =>
										onChoose({ id: routine.id, name: routine.name })
									}
								>
									<span className="type-body min-w-0 truncate text-foreground underline-offset-4 group-hover:underline">
										{routine.name}
									</span>
									<ChevronRight
										className="size-4 shrink-0 text-ink-3"
										aria-hidden
									/>
								</button>
							</li>
						))}
					</ul>
				)}
			</DialogContent>
		</Dialog>
	)
}
