'use client'

import { ROUTINE_DAYS_MAX, type RoutineScheduleMode } from '@sunsteel/contracts'
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { useSidebar } from '@/hooks/use-sidebar'
import { cn } from '@/lib/utils'
import { weekdayName } from '@/lib/utils/date'

import { CommonSplitCard } from './components/CommonSplitCard'
import { SelectedDaysSummary } from './components/SelectedDaysSummary'
import { TrainingDayButton } from './components/TrainingDayButton'
import {
	COMMON_SPLITS,
	DAYS_OF_WEEK,
	isSameTrainingSplit,
	SPLIT_NAME_KEY_BY_SPLIT,
} from './constants/training-days'
import { useTrainingDaySelection } from './hooks/useTrainingDaySelection'
import type { RoutineWizardData } from './types'
import {
	addRotationDay,
	applyRotationPreset,
	changeScheduleMode,
	describeRotationPreset,
	isRotationPreset,
	moveRotationDay,
	removeRotationDay,
	ROTATION_PRESETS,
	toggleRestDay,
	toggleRotationWeekday,
	wizardDayLabel,
} from './utils/schedule'

interface TrainingDaysProps {
	readonly data: RoutineWizardData
	readonly onUpdate: (updates: Partial<RoutineWizardData>) => void
	readonly isEditing?: boolean
}

const MODES: ReadonlyArray<{
	value: RoutineScheduleMode
	labelKey: 'weekly' | 'rotation'
	captionKey: 'weeklyCaption' | 'rotationCaption'
}> = [
	{ value: 'WEEKLY', labelKey: 'weekly', captionKey: 'weeklyCaption' },
	{ value: 'ROTATION', labelKey: 'rotation', captionKey: 'rotationCaption' },
]

function RotationDays({ data, onUpdate }: TrainingDaysProps) {
	const { isMobile } = useSidebar()
	const t = useTranslations('routines.trainingDays')
	const tPresets = useTranslations('routines.presets')
	const isFull = data.days.length >= ROUTINE_DAYS_MAX

	return (
		<div className="space-y-4 md:space-y-6">
			<div>
				<p className="type-body-sm mb-1.5 text-ink-3 md:mb-2">
					{t('quickSelectRotation')}
				</p>
				<div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:gap-2">
					{ROTATION_PRESETS.map(preset => {
						const described = describeRotationPreset(preset, tPresets)
						return (
							<CommonSplitCard
								key={preset.key}
								name={described.name}
								description={described.description}
								dayCount={described.days.length}
								isSelected={isRotationPreset(data, preset, tPresets)}
								isMobile={isMobile}
								onSelect={() =>
									onUpdate(applyRotationPreset(data, preset, tPresets))
								}
							/>
						)
					})}
				</div>
			</div>

			<div>
				<h4 className="type-panel text-foreground">
					{t('rotationOrder')}
					<span className="type-body-sm ml-2 text-ink-3">
						{t('daysOfMax', {
							count: data.days.length,
							max: ROUTINE_DAYS_MAX,
						})}
					</span>
				</h4>
				<p className="type-body-sm mt-1 text-ink-3">{t('nameEachDay')}</p>
				{data.days.length === 0 ? (
					<p className="type-body-sm mt-3 text-ink-3">
						{t('addAtLeastOneDay')}
					</p>
				) : (
					<ol className="mt-3 border-t border-rule-faint">
						{data.days.map((day, index) => {
							const label = wizardDayLabel('ROTATION', day, index)
							return (
								<li
									key={day.slot}
									className="rule-row flex items-center gap-2 py-2"
								>
									<span className="type-data w-6 text-ink-3">{index + 1}</span>
									<span className="type-panel min-w-0 flex-1 truncate text-foreground">
										{label}
									</span>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										// Hidden, not disabled, at the ends: a disabled button
										// takes the sunk fill and reads as selected.
										className={cn(
											'size-11 sm:size-9',
											index === 0 && 'invisible',
										)}
										aria-label={t('moveEarlier', { day: label })}
										disabled={index === 0}
										onClick={() =>
											onUpdate(moveRotationDay(data, day.slot, -1))
										}
									>
										<ArrowUp className="size-4" aria-hidden />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className={cn(
											'size-11 sm:size-9',
											index === data.days.length - 1 && 'invisible',
										)}
										aria-label={t('moveLater', { day: label })}
										disabled={index === data.days.length - 1}
										onClick={() => onUpdate(moveRotationDay(data, day.slot, 1))}
									>
										<ArrowDown className="size-4" aria-hidden />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="size-11 sm:size-9"
										aria-label={t('removeDay', { day: label })}
										onClick={() => onUpdate(removeRotationDay(data, day.slot))}
									>
										<X className="size-4" aria-hidden />
									</Button>
								</li>
							)
						})}
					</ol>
				)}
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="mt-3"
					disabled={isFull}
					onClick={() => onUpdate(addRotationDay(data))}
				>
					<Plus className="size-4" aria-hidden />
					{t('addDay')}
				</Button>
			</div>

			<RotationWeekdays data={data} onUpdate={onUpdate} />
		</div>
	)
}

/**
 * SCHED-06: the weekdays a rotation trains on. With them the schedule places
 * its days on those weekdays in order; without them it runs on any day.
 */
function RotationWeekdays({ data, onUpdate }: TrainingDaysProps) {
	const t = useTranslations('routines.trainingDays')
	const tDate = useTranslations('routines.date')
	return (
		<div>
			<p id="rotation-weekdays-label" className="type-body-sm text-ink-3">
				{t('trainingWeekdays')}
			</p>
			<p className="type-body-sm mb-2 text-ink-3">
				{t('trainingWeekdaysNote')}
			</p>
			<div
				role="group"
				aria-labelledby="rotation-weekdays-label"
				className="flex flex-wrap gap-1"
			>
				{DAYS_OF_WEEK.map(day => {
					const isOn = data.rotationWeekdays.includes(day.id)
					return (
						<Button
							key={day.id}
							type="button"
							size="sm"
							variant={isOn ? 'secondary' : 'ghost'}
							aria-pressed={isOn}
							aria-label={t('trainOn', {
								weekday: weekdayName(day.id, 'long', tDate),
							})}
							onClick={() => onUpdate(toggleRotationWeekday(data, day.id))}
						>
							{weekdayName(day.id, 'short', tDate)}
						</Button>
					)
				})}
			</div>
		</div>
	)
}

/**
 * SCHED-07: planned rest among the weekdays the routine does not train on.
 * It shows on the schedule as a rest day instead of an empty one.
 */
function RestDays({ data, onUpdate }: TrainingDaysProps) {
	const t = useTranslations('routines.trainingDays')
	const tDate = useTranslations('routines.date')
	const candidates = DAYS_OF_WEEK.filter(
		day => !data.trainingDays.includes(day.id),
	)
	if (data.trainingDays.length === 0 || candidates.length === 0) return null
	return (
		<div>
			<p id="rest-days-label" className="type-body-sm text-ink-3">
				{t('restDays')}
			</p>
			<p className="type-body-sm mb-2 text-ink-3">{t('restDaysNote')}</p>
			<div
				role="group"
				aria-labelledby="rest-days-label"
				className="flex flex-wrap gap-1"
			>
				{candidates.map(day => {
					const isRest = data.restDays.includes(day.id)
					return (
						<Button
							key={day.id}
							type="button"
							size="sm"
							variant={isRest ? 'secondary' : 'ghost'}
							aria-pressed={isRest}
							aria-label={t('restOn', {
								weekday: weekdayName(day.id, 'long', tDate),
							})}
							onClick={() => onUpdate(toggleRestDay(data, day.id))}
						>
							{weekdayName(day.id, 'short', tDate)}
						</Button>
					)
				})}
			</div>
		</div>
	)
}

function WeeklyDays({ data, onUpdate }: TrainingDaysProps) {
	const { isMobile } = useSidebar()
	const t = useTranslations('routines.trainingDays')
	const tDate = useTranslations('routines.date')
	const tPresets = useTranslations('routines.presets')
	const { toggleDay, selectSplit } = useTrainingDaySelection({
		data,
		onUpdate,
	})
	return (
		<div className="space-y-4 md:space-y-6">
			<div>
				<div className="mb-3 md:mb-4">
					<p className="text-xs text-muted-foreground mb-1.5 md:mb-2">
						{t('quickSelectSplits')}
					</p>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 md:gap-2">
						{COMMON_SPLITS.map(split => {
							const weekdays = split.days
								.map(day => weekdayName(day, 'short', tDate))
								.join(', ')
							const range = tPresets('weekdayRange', {
								from: weekdayName(split.days[0], 'short', tDate),
								to: weekdayName(
									split.days[split.days.length - 1],
									'short',
									tDate,
								),
							})
							const description =
								split.key === 'pushPullLegsX6'
									? tPresets('splitX6Description', { weekdays: range })
									: split.key === 'fullBody'
										? tPresets('splitFullBodyDescription', { weekdays })
										: tPresets('splitOnWeekdays', {
												count: split.days.length,
												weekdays: split.key === 'broSplit' ? range : weekdays,
											})
							return (
								<CommonSplitCard
									key={split.key}
									name={tPresets(SPLIT_NAME_KEY_BY_SPLIT[split.key])}
									description={description}
									dayCount={split.days.length}
									isSelected={isSameTrainingSplit(
										data.trainingDays,
										split.days,
									)}
									isMobile={isMobile}
									onSelect={() => selectSplit(split.days)}
								/>
							)
						})}
					</div>
				</div>
				<div>
					<p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
						{t('orSelectManually')}
					</p>
					<div className="grid grid-cols-7 gap-1 md:gap-2">
						{DAYS_OF_WEEK.map(day => (
							<TrainingDayButton
								key={day.id}
								day={day}
								isSelected={data.trainingDays.includes(day.id)}
								isLocked={false}
								isMobile={isMobile}
								onToggle={toggleDay}
							/>
						))}
					</div>
				</div>
			</div>

			<RestDays data={data} onUpdate={onUpdate} />

			<SelectedDaysSummary
				trainingDays={data.trainingDays}
				dayInfos={DAYS_OF_WEEK}
			/>
		</div>
	)
}

/**
 * ROUT-11: a routine is either weekly or a rotation. Switching keeps every day
 * and its exercises (`changeScheduleMode`).
 */
export function TrainingDays({ data, onUpdate }: TrainingDaysProps) {
	const t = useTranslations('routines.trainingDays')
	const mode = MODES.find(option => option.value === data.scheduleMode)
	return (
		<div className="space-y-4 md:space-y-6">
			<div>
				<h3 className="type-section mb-3 text-foreground md:mb-4">
					{data.scheduleMode === 'ROTATION'
						? t('whichRotationDays')
						: t('whichTrainingDays')}
					<span className="text-destructive ml-1">*</span>
				</h3>
				<div role="group" aria-label={t('schedule')} className="flex gap-1">
					{MODES.map(option => (
						<Button
							key={option.value}
							type="button"
							size="sm"
							variant={
								data.scheduleMode === option.value ? 'secondary' : 'ghost'
							}
							aria-pressed={data.scheduleMode === option.value}
							onClick={() => onUpdate(changeScheduleMode(data, option.value))}
						>
							{t(option.labelKey)}
						</Button>
					))}
				</div>
				<p className="type-body-sm mt-2 text-ink-3">
					{mode ? t(mode.captionKey) : null}
				</p>
			</div>

			{data.scheduleMode === 'ROTATION' ? (
				<RotationDays data={data} onUpdate={onUpdate} />
			) : (
				<WeeklyDays data={data} onUpdate={onUpdate} />
			)}
		</div>
	)
}
