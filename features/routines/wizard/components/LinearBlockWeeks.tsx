import { LP_BLOCK_STEPS } from '@sunsteel/contracts'
import { useTranslations } from 'next-intl'
import { useId } from 'react'

import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { exerciseLabel } from '@/i18n/catalog'
import type { Exercise } from '@/lib/api/types'
import { lpPositionLabel } from '@/lib/utils/linear-periodization'

import type { RoutineWizardData } from '../types'
import {
	runningLinearBlocks,
	sharedLinearStep,
	withAllLinearSteps,
} from '../utils/linear-block'
import { wizardDayTitle } from '../utils/schedule'

interface LinearBlockWeeksProps {
	data: RoutineWizardData
	exerciseMap: Record<string, Exercise>
	onUpdate: (updates: Partial<RoutineWizardData>) => void
}

/**
 * ROUT-20: the routine's running 8-week blocks and the week each starts at,
 * with one control that sets them all -- for a member starting the programme
 * part of the way through. Shown only when two or more blocks run, since one
 * is set where it is configured.
 */
export function LinearBlockWeeks({
	data,
	exerciseMap,
	onUpdate,
}: LinearBlockWeeksProps) {
	const t = useTranslations('routines.linearBlock')
	const tDate = useTranslations('routines.date')
	const tEx = useTranslations('catalog.exercises')
	const tDayCard = useTranslations('routines.dayCard')
	const selectId = useId()
	const slots = runningLinearBlocks(data)
	if (slots.length < 2) return null

	const rotation = data.scheduleMode === 'ROTATION'
	const shared = sharedLinearStep(slots)

	return (
		<section aria-labelledby={`${selectId}-heading`} className="space-y-3">
			<div className="space-y-1">
				<h3 id={`${selectId}-heading`} className="type-panel text-foreground">
					{t('reviewTitle')}
				</h3>
				<p className="type-body-sm text-ink-3">{t('reviewDescription')}</p>
			</div>
			<ul className="divide-y divide-rule-faint border-y border-rule">
				{slots.map(slot => {
					const day = data.days[slot.dayIndex]
					const name = exerciseMap[slot.exerciseId]?.name
					return (
						<li
							key={`${slot.dayIndex}-${slot.exerciseIndex}`}
							className="type-body-sm py-2 text-ink"
						>
							{t('reviewRow', {
								day: wizardDayTitle(
									data.scheduleMode,
									day,
									slot.dayIndex,
									tDate,
								),
								exercise: name
									? exerciseLabel(name, tEx)
									: tDayCard('exerciseFallback'),
								position: lpPositionLabel(slot.state, rotation, t),
							})}
						</li>
					)
				})}
			</ul>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Label htmlFor={selectId} className="text-sm font-medium text-ink-3">
					{t('reviewSetAll')}
				</Label>
				<NativeSelect
					id={selectId}
					value={shared === null ? '' : String(shared)}
					onChange={event => {
						const step = Number(event.target.value)
						if (!Number.isInteger(step) || step < 1) return
						onUpdate({ days: withAllLinearSteps(data.days, step) })
					}}
					className="w-40 sm:w-48"
				>
					{shared === null ? (
						<option value="" disabled>
							{t('reviewMixed')}
						</option>
					) : null}
					{Array.from({ length: LP_BLOCK_STEPS }, (_, index) => (
						<option key={index + 1} value={index + 1}>
							{t(rotation ? 'session' : 'week', {
								step: index + 1,
								total: LP_BLOCK_STEPS,
							})}
						</option>
					))}
				</NativeSelect>
			</div>
		</section>
	)
}
