'use client'

import { Calculator, Loader2, Settings } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { useTrainingLocations } from '@/lib/api/hooks/useTrainingLocations'
import { calculatePlateLoading } from '@/lib/utils/plate-calculator'
import {
	formatWeightAmount,
	formatWeightInput,
	getWeightUnitLabel,
	parseWeightInput,
} from '@/lib/utils/weight-unit'

interface PlateCalculatorDialogProps {
	exerciseName: string
	initialTargetWeightKg: number
}

export const PlateCalculatorDialog = ({
	exerciseName,
	initialTargetWeightKg,
}: PlateCalculatorDialogProps) => {
	const weightUnit = useWeightUnit()
	const unitLabel = getWeightUnitLabel(weightUnit)
	const { data: locations, isLoading, error, refetch } = useTrainingLocations()
	const [isOpen, setIsOpen] = useState(false)
	const [selectedLocationId, setSelectedLocationId] = useState('')
	const [targetInput, setTargetInput] = useState(() =>
		formatWeightInput(initialTargetWeightKg, weightUnit),
	)
	const defaultLocation =
		locations?.find(location => location.isDefault) ?? locations?.[0]
	const selectedLocation =
		locations?.find(location => location.id === selectedLocationId) ??
		defaultLocation
	const targetWeightKg = parseWeightInput(targetInput, weightUnit)
	const loading = useMemo(
		() =>
			selectedLocation && targetWeightKg !== undefined
				? calculatePlateLoading(
						targetWeightKg,
						selectedLocation.barWeightKg,
						selectedLocation.availablePlatePairs,
					)
				: undefined,
		[selectedLocation, targetWeightKg],
	)

	const formatWeight = (weightKg: number) =>
		`${formatWeightAmount(weightKg, weightUnit)} ${unitLabel}`

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open)
		if (open) {
			setSelectedLocationId(defaultLocation?.id ?? '')
			setTargetInput(formatWeightInput(initialTargetWeightKg, weightUnit))
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label={`Calculate plates for ${exerciseName}`}
					title="Plate calculator"
				>
					<Calculator className="h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Plate Calculator</DialogTitle>
					<DialogDescription>
						{exerciseName}: load the target using the equipment saved for this
						location.
					</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
						<Loader2 className="h-4 w-4 animate-spin" />
						Loading equipment…
					</div>
				) : error ? (
					<div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
						<p className="text-destructive">{error.message}</p>
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
				) : !locations?.length ? (
					<div className="space-y-4 rounded-md border border-dashed p-5 text-center">
						<div>
							<p className="font-medium">No equipment preferences saved</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Add a training location, bar and plate pairs first.
							</p>
						</div>
						<Button asChild variant="outline">
							<Link href="/settings">
								<Settings className="h-4 w-4" />
								Open Settings
							</Link>
						</Button>
					</div>
				) : (
					<div className="space-y-5">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="plate-calculator-location">Location</Label>
								<Select
									value={selectedLocation?.id}
									onValueChange={setSelectedLocationId}
								>
									<SelectTrigger
										id="plate-calculator-location"
										className="w-full"
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{locations.map(location => (
											<SelectItem key={location.id} value={location.id}>
												{location.name}
												{location.isDefault ? ' (default)' : ''}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="plate-calculator-target">
									Target ({unitLabel})
								</Label>
								<Input
									id="plate-calculator-target"
									type="number"
									inputMode="decimal"
									min="0"
									step={weightUnit === 'LB' ? '1' : '0.5'}
									value={targetInput}
									onChange={event => setTargetInput(event.target.value)}
								/>
							</div>
						</div>

						{selectedLocation ? (
							<div
								className="rounded-md border bg-muted/30 p-4"
								aria-live="polite"
							>
								<div className="flex items-center justify-between gap-3 text-sm">
									<span className="text-muted-foreground">Bar</span>
									<span className="font-medium">
										{formatWeight(selectedLocation.barWeightKg)}
									</span>
								</div>

								{loading ? (
									<>
										<div className="mt-3 border-t pt-3">
											<p className="text-sm font-semibold">
												{loading.status === 'exact'
													? `Load ${formatWeight(loading.loadedWeightKg)}`
													: loading.status === 'short'
														? `Closest available: ${formatWeight(loading.loadedWeightKg)}`
														: `Bar alone loads ${formatWeight(loading.loadedWeightKg)}`}
											</p>
											{loading.status === 'short' ? (
												<p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
													{formatWeight(loading.differenceKg)} below target
												</p>
											) : loading.status === 'over' ? (
												<p className="mt-1 text-xs text-destructive">
													The saved bar is {formatWeight(loading.differenceKg)}
													heavier than this target.
												</p>
											) : null}
										</div>

										<div className="mt-4 space-y-2">
											<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
												Plates per side
											</p>
											{loading.platesPerSide.length ? (
												loading.platesPerSide.map(plate => (
													<div
														key={plate.weightKg}
														className="flex items-center justify-between border-b py-2 text-sm last:border-0"
													>
														<span>{formatWeight(plate.weightKg)}</span>
														<span className="font-mono font-semibold">
															× {plate.platesPerSide}
														</span>
													</div>
												))
											) : (
												<p className="text-sm text-muted-foreground">
													No plates needed.
												</p>
											)}
										</div>
									</>
								) : (
									<p className="mt-3 border-t pt-3 text-sm text-destructive">
										Enter a valid target weight.
									</p>
								)}
							</div>
						) : null}
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}
