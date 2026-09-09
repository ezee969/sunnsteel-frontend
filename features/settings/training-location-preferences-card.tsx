'use client'

import type { WeightUnit } from '@sunsteel/contracts'
import { Loader2, MapPin, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import {
	useReplaceTrainingLocations,
	useTrainingLocations,
} from '@/lib/api/hooks/useTrainingLocations'
import {
	buildTrainingLocationsRequest,
	convertTrainingLocationDrafts,
	createPlatePairDraft,
	createTrainingLocationDraft,
	type TrainingLocationDraft,
	trainingLocationsToDrafts,
} from '@/lib/utils/training-location-preferences'
import { getWeightUnitLabel } from '@/lib/utils/weight-unit'

interface TrainingLocationPreferencesCardProps {
	weightUnit: WeightUnit
}

export const TrainingLocationPreferencesCard = ({
	weightUnit,
}: TrainingLocationPreferencesCardProps) => {
	const { data: locations, isLoading, error, refetch } = useTrainingLocations()
	const replaceLocations = useReplaceTrainingLocations()
	const { push } = useToast()
	const [drafts, setDrafts] = useState<TrainingLocationDraft[]>([])
	const [formError, setFormError] = useState<string | null>(null)
	const weightUnitRef = useRef(weightUnit)

	useEffect(() => {
		if (locations) {
			setDrafts(trainingLocationsToDrafts(locations, weightUnitRef.current))
			setFormError(null)
		}
	}, [locations])

	useEffect(() => {
		const previousUnit = weightUnitRef.current
		if (previousUnit === weightUnit) return
		setDrafts(current =>
			convertTrainingLocationDrafts(current, previousUnit, weightUnit),
		)
		weightUnitRef.current = weightUnit
	}, [weightUnit])

	const updateLocation = (
		key: string,
		update: (location: TrainingLocationDraft) => TrainingLocationDraft,
	) => {
		setDrafts(current =>
			current.map(location =>
				location.key === key ? update(location) : location,
			),
		)
		setFormError(null)
	}

	const addLocation = () => {
		setDrafts(current => [
			...current,
			createTrainingLocationDraft(weightUnit, current.length),
		])
		setFormError(null)
	}

	const removeLocation = (key: string) => {
		setDrafts(current => {
			const remaining = current.filter(location => location.key !== key)
			if (
				remaining.length > 0 &&
				!remaining.some(location => location.isDefault)
			) {
				return remaining.map((location, index) => ({
					...location,
					isDefault: index === 0,
				}))
			}
			return remaining
		})
		setFormError(null)
	}

	const makeDefault = (key: string) => {
		setDrafts(current =>
			current.map(location => ({
				...location,
				isDefault: location.key === key,
			})),
		)
		setFormError(null)
	}

	const save = () => {
		try {
			const request = buildTrainingLocationsRequest(drafts, weightUnit)
			setFormError(null)
			replaceLocations.mutate(request, {
				onSuccess: () => {
					push({
						title: 'Equipment preferences saved',
						description: 'Your training locations are ready for workouts.',
						variant: 'success',
					})
				},
				onError: mutationError => {
					setFormError(mutationError.message)
				},
			})
		} catch (validationError) {
			setFormError(
				validationError instanceof Error
					? validationError.message
					: 'Check the training-location fields and try again.',
			)
		}
	}

	return (
		<Card>
			<CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1.5">
					<CardTitle className="flex items-center gap-2">
						<MapPin className="h-4 w-4 text-ink-3" aria-hidden />
						Training Locations
					</CardTitle>
					<CardDescription>
						Save the bar, plate pairs and equipment available at each gym.
						Weights follow your account unit and are stored canonically in kg.
					</CardDescription>
				</div>
				<Button
					type="button"
					variant="outline"
					onClick={addLocation}
					disabled={isLoading || drafts.length >= 10}
				>
					<Plus className="mr-2 h-4 w-4" />
					Add Location
				</Button>
			</CardHeader>
			<CardContent className="space-y-4">
				{isLoading ? (
					<div className="type-body-sm flex items-center justify-center gap-2 py-8 text-ink-3">
						<Loader2 className="h-4 w-4 animate-spin" />
						Loading equipment preferences…
					</div>
				) : error ? (
					<div className="rounded-sm border border-destructive bg-surface p-4">
						<p className="type-body-sm text-destructive">{error.message}</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="mt-3"
							onClick={() => refetch()}
						>
							Try Again
						</Button>
					</div>
				) : (
					<>
						{drafts.length === 0 ? (
							<div className="rounded-sm border border-dashed border-rule p-6 text-center">
								<p className="type-panel text-foreground">
									No training locations saved
								</p>
								<p className="type-body-sm mt-1 text-ink-3">
									Add the gym or home setup you train with most often.
								</p>
							</div>
						) : null}

						{drafts.map((location, locationIndex) => (
							<section
								key={location.key}
								className="space-y-4 rounded-none border border-rule-faint bg-surface-sunk p-4"
							>
								<div className="flex flex-wrap items-end gap-3">
									<div className="min-w-48 flex-1 space-y-2">
										<Label htmlFor={`location-${location.key}`}>
											Location Name
										</Label>
										<Input
											id={`location-${location.key}`}
											value={location.name}
											maxLength={80}
											onChange={event =>
												updateLocation(location.key, current => ({
													...current,
													name: event.target.value,
												}))
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor={`bar-${location.key}`}>
											Bar Weight ({getWeightUnitLabel(weightUnit)})
										</Label>
										<Input
											id={`bar-${location.key}`}
											className="max-w-[var(--field-max)]"
											type="number"
											min="0.5"
											max={weightUnit === 'KG' ? '100' : '220.46'}
											step="0.01"
											value={location.barWeight}
											onChange={event =>
												updateLocation(location.key, current => ({
													...current,
													barWeight: event.target.value,
												}))
											}
										/>
									</div>
									<label className="type-body-sm flex h-11 items-center gap-2 rounded-sm border border-rule bg-surface px-3 text-foreground md:h-10">
										<input
											type="radio"
											className="accent-[color:var(--primary)]"
											name="default-training-location"
											checked={location.isDefault}
											onChange={() => makeDefault(location.key)}
										/>
										Default
									</label>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										aria-label={`Remove ${location.name || `location ${locationIndex + 1}`}`}
										onClick={() => removeLocation(location.key)}
									>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								</div>

								<div className="space-y-2">
									<Label htmlFor={`equipment-${location.key}`}>
										Available Equipment
									</Label>
									<Input
										id={`equipment-${location.key}`}
										value={location.equipment}
										placeholder="barbell, rack, bench, dumbbells"
										onChange={event =>
											updateLocation(location.key, current => ({
												...current,
												equipment: event.target.value,
											}))
										}
									/>
									<p className="type-body-sm text-ink-3">
										Separate equipment with commas.
									</p>
								</div>

								<div className="space-y-3">
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="type-panel text-foreground">
												Available Plate Pairs
											</p>
											<p className="type-body-sm text-ink-3">
												Enter the weight of one plate and how many pairs exist.
											</p>
										</div>
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled={location.availablePlatePairs.length >= 20}
											onClick={() =>
												updateLocation(location.key, current => ({
													...current,
													availablePlatePairs: [
														...current.availablePlatePairs,
														createPlatePairDraft(weightUnit),
													],
												}))
											}
										>
											<Plus className="mr-2 h-4 w-4" />
											Add Plate
										</Button>
									</div>

									{location.availablePlatePairs.map(plate => (
										<div
											key={plate.key}
											className="flex flex-wrap items-end gap-3"
										>
											<div className="space-y-2">
												<Label htmlFor={`plate-weight-${plate.key}`}>
													Plate ({getWeightUnitLabel(weightUnit)})
												</Label>
												<Input
													id={`plate-weight-${plate.key}`}
													className="max-w-[var(--field-max)]"
													type="number"
													min="0.05"
													step="0.01"
													value={plate.weight}
													onChange={event =>
														updateLocation(location.key, current => ({
															...current,
															availablePlatePairs:
																current.availablePlatePairs.map(currentPlate =>
																	currentPlate.key === plate.key
																		? {
																				...currentPlate,
																				weight: event.target.value,
																			}
																		: currentPlate,
																),
														}))
													}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor={`plate-count-${plate.key}`}>
													Pairs
												</Label>
												<Input
													id={`plate-count-${plate.key}`}
													className="max-w-[var(--field-max)]"
													type="number"
													min="1"
													max="20"
													step="1"
													value={plate.pairCount}
													onChange={event =>
														updateLocation(location.key, current => ({
															...current,
															availablePlatePairs:
																current.availablePlatePairs.map(currentPlate =>
																	currentPlate.key === plate.key
																		? {
																				...currentPlate,
																				pairCount: event.target.value,
																			}
																		: currentPlate,
																),
														}))
													}
												/>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												aria-label="Remove plate"
												onClick={() =>
													updateLocation(location.key, current => ({
														...current,
														availablePlatePairs:
															current.availablePlatePairs.filter(
																currentPlate => currentPlate.key !== plate.key,
															),
													}))
												}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</div>
									))}
								</div>
							</section>
						))}

						{formError ? (
							<p className="type-body-sm text-destructive" role="alert">
								{formError}
							</p>
						) : null}

						<div className="flex justify-end">
							<Button
								type="button"
								onClick={save}
								disabled={replaceLocations.isPending}
								className="min-w-40"
							>
								{replaceLocations.isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								Save Equipment
							</Button>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	)
}
