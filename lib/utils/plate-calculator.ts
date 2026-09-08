import type { PlatePairInventory } from '@sunsteel/contracts'

const CANONICAL_SCALE = 10_000
const DENSE_CAPACITY_LIMIT = 200_000

interface PlateChunk {
	plateIndex: number
	quantity: number
	value: number
}

export interface PlateLoadingItem {
	weightKg: number
	platesPerSide: number
}

export interface PlateLoadingResult {
	targetWeightKg: number
	loadedWeightKg: number
	differenceKg: number
	status: 'exact' | 'short' | 'over'
	platesPerSide: PlateLoadingItem[]
}

const toCanonicalUnits = (weightKg: number) =>
	Math.round(weightKg * CANONICAL_SCALE)

const fromCanonicalUnits = (units: number) => units / CANONICAL_SCALE

const greatestCommonDivisor = (left: number, right: number): number => {
	let a = Math.abs(left)
	let b = Math.abs(right)
	while (b > 0) {
		const remainder = a % b
		a = b
		b = remainder
	}
	return a
}

const buildChunks = (
	plates: PlatePairInventory[],
	divisor: number,
): PlateChunk[] => {
	const chunks: PlateChunk[] = []
	plates.forEach((plate, plateIndex) => {
		const pairValue = Math.round(
			(toCanonicalUnits(plate.weightKg) * 2) / divisor,
		)
		let remaining = plate.pairCount
		let chunkSize = 1
		while (remaining > 0) {
			const quantity = Math.min(chunkSize, remaining)
			chunks.push({
				plateIndex,
				quantity,
				value: pairValue * quantity,
			})
			remaining -= quantity
			chunkSize *= 2
		}
	})
	return chunks
}

const reconstructSelection = (
	best: number,
	chunks: PlateChunk[],
	previousSum: (sum: number) => number,
	previousChunk: (sum: number) => number,
	plateCount: number,
): number[] => {
	const selection = Array.from({ length: plateCount }, () => 0)
	let current = best
	while (current > 0) {
		const chunkIndex = previousChunk(current)
		if (chunkIndex < 0) break
		const chunk = chunks[chunkIndex]
		selection[chunk.plateIndex] += chunk.quantity
		current = previousSum(current)
	}
	return selection
}

const solveDense = (
	capacity: number,
	chunks: PlateChunk[],
	plateCount: number,
): { best: number; selection: number[] } => {
	const reachable = new Uint8Array(capacity + 1)
	const previousSum = new Int32Array(capacity + 1)
	const previousChunk = new Int16Array(capacity + 1)
	previousSum.fill(-1)
	previousChunk.fill(-1)
	reachable[0] = 1

	chunks.forEach((chunk, chunkIndex) => {
		for (let sum = capacity; sum >= chunk.value; sum -= 1) {
			if (!reachable[sum] && reachable[sum - chunk.value]) {
				reachable[sum] = 1
				previousSum[sum] = sum - chunk.value
				previousChunk[sum] = chunkIndex
			}
		}
	})

	let best = capacity
	while (best > 0 && !reachable[best]) best -= 1
	return {
		best,
		selection: reconstructSelection(
			best,
			chunks,
			sum => previousSum[sum],
			sum => previousChunk[sum],
			plateCount,
		),
	}
}

const solveSparse = (
	capacity: number,
	chunks: PlateChunk[],
	plateCount: number,
): { best: number; selection: number[] } => {
	const reachable = new Map<number, { previous: number; chunkIndex: number }>()
	reachable.set(0, { previous: -1, chunkIndex: -1 })

	chunks.forEach((chunk, chunkIndex) => {
		const currentSums = Array.from(reachable.keys())
		for (const sum of currentSums) {
			const next = sum + chunk.value
			if (next <= capacity && !reachable.has(next)) {
				reachable.set(next, { previous: sum, chunkIndex })
			}
		}
	})

	let best = 0
	for (const sum of reachable.keys()) {
		if (sum > best) best = sum
	}
	return {
		best,
		selection: reconstructSelection(
			best,
			chunks,
			sum => reachable.get(sum)?.previous ?? -1,
			sum => reachable.get(sum)?.chunkIndex ?? -1,
			plateCount,
		),
	}
}

export const calculatePlateLoading = (
	targetWeightKg: number,
	barWeightKg: number,
	availablePlatePairs: PlatePairInventory[],
): PlateLoadingResult => {
	const targetUnits = Math.max(0, toCanonicalUnits(targetWeightKg))
	const barUnits = Math.max(0, toCanonicalUnits(barWeightKg))

	if (targetUnits < barUnits) {
		return {
			targetWeightKg: fromCanonicalUnits(targetUnits),
			loadedWeightKg: fromCanonicalUnits(barUnits),
			differenceKg: fromCanonicalUnits(barUnits - targetUnits),
			status: 'over',
			platesPerSide: [],
		}
	}

	const plates = availablePlatePairs
		.filter(plate => plate.weightKg > 0 && plate.pairCount > 0)
		.sort((left, right) => right.weightKg - left.weightKg)
	const pairValues = plates.map(plate => toCanonicalUnits(plate.weightKg) * 2)
	const divisor = pairValues.reduce(greatestCommonDivisor, 0) || 1
	const residualUnits = targetUnits - barUnits
	const requestedCapacity = Math.floor(residualUnits / divisor)
	const inventoryCapacity = pairValues.reduce(
		(total, value, index) =>
			total + (value / divisor) * plates[index].pairCount,
		0,
	)
	const capacity = Math.min(requestedCapacity, inventoryCapacity)
	const chunks = buildChunks(plates, divisor)
	const solution =
		capacity <= DENSE_CAPACITY_LIMIT
			? solveDense(capacity, chunks, plates.length)
			: solveSparse(capacity, chunks, plates.length)
	const plateUnits = solution.best * divisor
	const loadedUnits = barUnits + plateUnits
	const differenceUnits = targetUnits - loadedUnits

	return {
		targetWeightKg: fromCanonicalUnits(targetUnits),
		loadedWeightKg: fromCanonicalUnits(loadedUnits),
		differenceKg: fromCanonicalUnits(differenceUnits),
		status: differenceUnits === 0 ? 'exact' : 'short',
		platesPerSide: plates.flatMap((plate, index) =>
			solution.selection[index] > 0
				? [
						{
							weightKg: plate.weightKg,
							platesPerSide: solution.selection[index],
						},
					]
				: [],
		),
	}
}
