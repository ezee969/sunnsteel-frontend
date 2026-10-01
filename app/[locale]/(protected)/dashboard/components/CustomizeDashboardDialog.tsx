'use client'

import {
	type DashboardLayout,
	DEFAULT_DASHBOARD_LAYOUT,
	normalizeDashboardLayout,
} from '@sunsteel/contracts'
import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useId, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useUpdateDashboardLayout } from '@/lib/api/hooks/useUpdateDashboardLayout'
import {
	dashboardSectionLabel,
	describeShownCount,
	moveDashboardSection,
	sameDashboardLayout,
	setDashboardSectionShown,
} from '@/lib/utils/dashboard-layout'

/**
 * DASH-05: reorder and hide the configurable sections. Changes stay in a draft
 * until Save, which stores them on the account (PREF-03).
 *
 * Each row is a grid of the section's name, its move controls and its Show
 * checkbox. A per-device control (UX-02's collapsed or open) would be one more
 * `auto` column on the same grid; it is deliberately not built here, and
 * nothing about it is stored in the layout.
 */
export function CustomizeDashboardDialog({
	layout,
	gettingStarted = false,
	open,
	onOpenChange,
}: {
	layout: DashboardLayout | undefined
	/**
	 * UX-19: the page is leaving out empty sections for a new account. The
	 * list still shows the stored layout -- every section shown -- because
	 * that is what saving keeps, so the dialog says why the page shows fewer.
	 */
	gettingStarted?: boolean
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const errorText = useApiErrorMessage()
	const t = useTranslations('planning.dashboardLayout')
	const tA = useTranslations('planning.dashboardActions')
	const saved = normalizeDashboardLayout(layout)
	const [draft, setDraft] = useState(saved)
	const [announcement, setAnnouncement] = useState('')
	const update = useUpdateDashboardLayout()
	const listRef = useRef<HTMLOListElement>(null)
	const baseId = useId()

	const move = (index: number, delta: -1 | 1) => {
		const next = moveDashboardSection(draft, index, delta)
		if (next === draft) return
		const target = index + delta
		const moved = next[target]
		setDraft(next)
		setAnnouncement(
			t('movedAnnouncement', {
				section: dashboardSectionLabel(moved.id, t),
				position: target + 1,
				total: next.length,
			}),
		)
		// The row keeps its focused button as it moves. At either end that button
		// is disabled, so hand focus to the other one rather than dropping it.
		requestAnimationFrame(() => {
			const row = listRef.current?.querySelector<HTMLElement>(
				`[data-section="${moved.id}"]`,
			)
			const wanted = row?.querySelector<HTMLButtonElement>(
				`[data-move="${delta}"]`,
			)
			if (wanted?.disabled) {
				row
					?.querySelector<HTMLButtonElement>(`[data-move="${-delta}"]`)
					?.focus()
			}
		})
	}

	const save = () => {
		update.mutate({ sections: draft }, { onSuccess: () => onOpenChange(false) })
	}

	const unchanged = sameDashboardLayout(draft, saved)

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{tA('customizeTitle')}</DialogTitle>
					<DialogDescription>{tA('customizeDescription')}</DialogDescription>
				</DialogHeader>
				{gettingStarted ? (
					<p className="type-body-sm text-ink-3">{tA('gettingStartedNote')}</p>
				) : null}

				<div>
					<p className="type-body-sm text-ink-3">
						{describeShownCount(draft, t)}
					</p>
					<ol ref={listRef} className="mt-2 border-t border-rule-faint">
						{draft.map((entry, index) => {
							const label = dashboardSectionLabel(entry.id, t)
							const showId = `${baseId}-show-${entry.id}`
							return (
								<li
									key={entry.id}
									data-section={entry.id}
									className="rule-row grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 py-2"
								>
									<div className="min-w-0">
										<p className="type-body-sm break-words text-foreground">
											{label}
										</p>
										{entry.hidden ? (
											<p className="type-body-sm text-ink-3">{tA('hidden')}</p>
										) : null}
									</div>
									<div className="flex gap-1">
										<Button
											type="button"
											variant="ghost"
											size="icon"
											data-move="-1"
											aria-label={tA('moveUp', { section: label })}
											disabled={index === 0}
											onClick={() => move(index, -1)}
										>
											<ArrowUp className="size-4" aria-hidden />
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											data-move="1"
											aria-label={tA('moveDown', { section: label })}
											disabled={index === draft.length - 1}
											onClick={() => move(index, 1)}
										>
											<ArrowDown className="size-4" aria-hidden />
										</Button>
									</div>
									<div className="flex items-center gap-2">
										<Checkbox
											id={showId}
											checked={!entry.hidden}
											onCheckedChange={checked =>
												setDraft(current =>
													setDashboardSectionShown(
														current,
														entry.id,
														checked === true,
													),
												)
											}
											aria-label={tA('showSection', { section: label })}
										/>
										<Label
											htmlFor={showId}
											className="type-body-sm font-normal text-ink-2"
										>
											{tA('show')}
										</Label>
									</div>
								</li>
							)
						})}
					</ol>
					<p aria-live="polite" className="sr-only">
						{announcement}
					</p>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="mt-3"
						disabled={sameDashboardLayout(draft, DEFAULT_DASHBOARD_LAYOUT)}
						onClick={() => {
							setDraft(DEFAULT_DASHBOARD_LAYOUT.map(entry => ({ ...entry })))
							setAnnouncement(tA('resetAnnouncement'))
						}}
					>
						{tA('reset')}
					</Button>
				</div>

				{update.isError ? (
					<p role="alert" className="type-body-sm text-ink">
						{errorText(update.error) || tA('saveFailed')}
					</p>
				) : null}

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						{tA('cancel')}
					</Button>
					<Button
						type="button"
						onClick={save}
						disabled={update.isPending || unchanged}
					>
						{update.isPending ? (
							<Loader2 className="size-4 animate-spin" aria-hidden />
						) : null}
						{tA('save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
