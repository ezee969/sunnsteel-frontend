'use client'

import type { WeightUnit } from '@sunsteel/contracts'
import { Flame } from 'lucide-react'
import { useMemo, useState } from 'react'

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
import { NativeSelect } from '@/components/ui/native-select'
import { useToast } from '@/components/ui/toast'
import {
	useReplaceTrainingLocations,
	useTrainingLocations,
} from '@/lib/api/hooks/useTrainingLocations'
import { defaultTrainingLocation } from '@/lib/utils/exercise-equipment'
import {
	BAR_CHOICES_KG,
	buildWarmUpRamp,
	describeBasis,
	describePlates,
	equipmentBasis,
	isBarLoaded,
	MAX_SETS_PER_EXERCISE,
	PLATE_SET_LABELS,
	PLATE_SETS,
	type PlateSetChoice,
	saveEquipmentRequest,
} from '@/lib/utils/warm-up-ramp'
import { formatWeight } from '@/lib/utils/weight-unit'

import type { RoutineSet } from '../types'
import { leadSetIndex } from '../utils/set-kinds'

interface WarmUpRampDialogProps {
	exerciseName: string
	sets: RoutineSet[]
	/** EXER-09 equipment, which decides bar-and-plates or the exercise step. */
	equipmentRequired?: readonly string[]
	incrementKg: number
	weightUnit: WeightUnit
	onApply: (warmUps: { weightKg: number; reps: number }[]) => void
}

/**
 * LIVE-13: "Add warm-up sets" on a builder exercise. It previews the ramp and
 * says what the loads were made from before anything is inserted; with no
 * gym saved it asks for the bar and plates instead of guessing, and can save
 * them as the member's gym so the question is asked once.
 */
export function WarmUpRampDialog({
	exerciseName,
	sets,
	equipmentRequired,
	incrementKg,
	weightUnit,
	onApply,
}: WarmUpRampDialogProps) {
	const [open, setOpen] = useState(false)
	const lead = leadSetIndex(sets)
	const workingWeightKg = lead >= 0 ? (sets[lead].weight ?? 0) : 0
	const room =
		MAX_SETS_PER_EXERCISE - sets.filter(set => set.kind !== 'WARMUP').length

	// Offered only when there is a working load to ramp towards.
	if (!(workingWeightKg > 0)) return null

	return (
		<>
			<Button
				type="button"
				variant="ghost"
				className="h-10 w-full text-base"
				disabled={room <= 0}
				aria-label={`Add warm-up sets to ${exerciseName}`}
				onClick={() => setOpen(true)}
			>
				<Flame className="mr-2 h-4 w-4" aria-hidden />
				Add warm-up sets
			</Button>
			{room <= 0 ? (
				<p className="type-body-sm -mt-2 mb-3 text-center text-ink-3">
					An exercise holds at most {MAX_SETS_PER_EXERCISE} sets, so there is no
					room for warm-ups.
				</p>
			) : null}
			{open ? (
				<WarmUpRampPreview
					exerciseName={exerciseName}
					workingWeightKg={workingWeightKg}
					hasWarmUps={sets.some(set => set.kind === 'WARMUP')}
					room={room}
					barLoaded={isBarLoaded(equipmentRequired)}
					incrementKg={incrementKg}
					weightUnit={weightUnit}
					onClose={() => setOpen(false)}
					onApply={warmUps => {
						onApply(warmUps)
						setOpen(false)
					}}
				/>
			) : null}
		</>
	)
}

function WarmUpRampPreview({
	exerciseName,
	workingWeightKg,
	hasWarmUps,
	room,
	barLoaded,
	incrementKg,
	weightUnit,
	onClose,
	onApply,
}: {
	exerciseName: string
	workingWeightKg: number
	hasWarmUps: boolean
	room: number
	barLoaded: boolean
	incrementKg: number
	weightUnit: WeightUnit
	onClose: () => void
	onApply: (warmUps: { weightKg: number; reps: number }[]) => void
}) {
	const { push } = useToast()
	const { data: locations = [] } = useTrainingLocations()
	const save = useReplaceTrainingLocations()
	const gym = defaultTrainingLocation(locations)
	const basis = equipmentBasis(gym)
	const asks = barLoaded && basis.kind !== 'SAVED'
	const barChoices = BAR_CHOICES_KG[weightUnit]

	const [barWeightKg, setBarWeightKg] = useState(
		gym?.barWeightKg ?? barChoices[0],
	)
	const [plateSet, setPlateSet] = useState<PlateSetChoice>('STANDARD')
	// On by default only when nothing is saved yet: the question is then
	// asked once. Filling an existing gym's empty plate list is opt-in.
	const [remember, setRemember] = useState(basis.kind === 'NO_LOCATION')

	const platePairs =
		basis.kind === 'SAVED'
			? basis.location.availablePlatePairs
			: PLATE_SETS[weightUnit][plateSet]

	const ramp = useMemo(
		() =>
			buildWarmUpRamp({
				workingWeightKg,
				barLoaded,
				barWeightKg,
				platePairs,
				incrementKg,
				room,
			}),
		[workingWeightKg, barLoaded, barWeightKg, platePairs, incrementKg, room],
	)

	const apply = async () => {
		const request =
			asks && remember
				? saveEquipmentRequest({
						locations,
						basis,
						barWeightKg,
						platePairs,
					})
				: null
		if (request) {
			try {
				await save.mutateAsync(request)
			} catch (error) {
				push({
					title: 'Warm-ups added, but your gym was not saved',
					description:
						error instanceof Error ? error.message : 'Try again in Settings.',
					variant: 'destructive',
				})
			}
		}
		onApply(ramp.sets.map(({ weightKg, reps }) => ({ weightKg, reps })))
	}

	const saveLabel =
		basis.kind === 'NO_PLATES'
			? `Save these plates to ${basis.location.name}`
			: 'Save as my gym'

	return (
		<Dialog open onOpenChange={next => !next && onClose()}>
			<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Warm-up sets</DialogTitle>
					<DialogDescription>
						A ramp up to {formatWeight(workingWeightKg, weightUnit)} for{' '}
						{exerciseName}. Warm-ups never count toward volume, records or
						progress, and their loads stay as written when progression moves the
						working sets.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{asks ? (
						<div className="grid gap-4 sm:grid-cols-2">
							{basis.kind === 'NO_LOCATION' ? (
								<div className="space-y-2">
									<Label htmlFor="warm-up-bar">Bar</Label>
									<NativeSelect
										id="warm-up-bar"
										value={String(barWeightKg)}
										onChange={event =>
											setBarWeightKg(Number(event.target.value))
										}
									>
										{barChoices.map(kg => (
											<option key={kg} value={String(kg)}>
												{formatWeight(kg, weightUnit)}
											</option>
										))}
									</NativeSelect>
								</div>
							) : null}
							<div className="space-y-2">
								<Label htmlFor="warm-up-plates">Plates</Label>
								<NativeSelect
									id="warm-up-plates"
									value={plateSet}
									onChange={event =>
										setPlateSet(event.target.value as PlateSetChoice)
									}
								>
									{(['STANDARD', 'LIGHT'] as const).map(choice => (
										<option key={choice} value={choice}>
											{PLATE_SET_LABELS[choice]}
										</option>
									))}
								</NativeSelect>
								<p className="type-body-sm text-ink-3">
									{PLATE_SETS[weightUnit][plateSet]
										.map(pair =>
											formatWeight(pair.weightKg, weightUnit).replace(
												/\s?(kg|lb)$/,
												'',
											),
										)
										.join(', ')}{' '}
									{weightUnit === 'LB' ? 'lb' : 'kg'} pairs
								</p>
							</div>
						</div>
					) : null}

					<p className="type-body-sm text-ink-2">
						{describeBasis({
							barLoaded,
							basis,
							barWeightKg,
							plateSet,
							incrementKg,
							unit: weightUnit,
						})}
					</p>

					{ramp.sets.length > 0 ? (
						<ol
							aria-label="Warm-up sets to add"
							className="border-y border-rule"
						>
							{ramp.sets.map((set, index) => (
								<li
									key={index}
									className="rule-row flex items-baseline justify-between gap-4 py-2"
								>
									<span className="type-label text-ink-3">
										Warm-up {index + 1}
									</span>
									<span className="flex flex-col items-end">
										<span className="type-data text-foreground">
											{formatWeight(set.weightKg, weightUnit)} × {set.reps}
										</span>
										{set.platesPerSide ? (
											<span className="type-body-sm text-ink-3">
												{describePlates(set.platesPerSide, weightUnit)}
												{set.limited ? ' · closest you can load' : ''}
											</span>
										) : null}
									</span>
								</li>
							))}
						</ol>
					) : (
						<p className="type-body-sm text-ink-2">
							The working load is too light for a ramp: every step would be at
							or above it.
						</p>
					)}

					{ramp.leftOut > 0 ? (
						<p className="type-body-sm text-ink-3">
							{ramp.leftOut === 1
								? 'The lightest step is left out'
								: `The ${ramp.leftOut} lightest steps are left out`}{' '}
							to stay within {MAX_SETS_PER_EXERCISE} sets.
						</p>
					) : null}
					{hasWarmUps ? (
						<p className="type-body-sm text-ink-3">
							These replace this exercise&apos;s current warm-ups.
						</p>
					) : null}

					{asks ? (
						<div className="flex items-center gap-1">
							<label
								htmlFor="warm-up-remember"
								className="flex size-11 cursor-pointer items-center justify-center"
							>
								<Checkbox
									id="warm-up-remember"
									checked={remember}
									onCheckedChange={checked => setRemember(checked === true)}
								/>
							</label>
							<Label htmlFor="warm-up-remember" className="cursor-pointer">
								{saveLabel}
							</Label>
						</div>
					) : null}
				</div>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						type="button"
						disabled={ramp.sets.length === 0 || save.isPending}
						onClick={apply}
					>
						{save.isPending
							? 'Saving…'
							: ramp.sets.length === 1
								? 'Add 1 warm-up set'
								: `Add ${ramp.sets.length} warm-up sets`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
