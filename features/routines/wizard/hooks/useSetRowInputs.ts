import type { WeightUnit } from '@sunsteel/contracts'
import { useCallback, useEffect, useState } from 'react'

import { formatWeightInput, parseWeightInput } from '@/lib/utils/weight-unit'

import type { RoutineSet } from '../types'
import {
	parseOptionalPositiveFloat,
	sanitizeDecimalInput,
	sanitizeIntegerInput,
} from '../utils/validation.helpers'

interface UseSetRowInputsOptions {
	set: RoutineSet
	exerciseIndex: number
	setIndex: number
	onUpdateSet: (
		exerciseIndex: number,
		setIndex: number,
		field: 'repType' | 'reps' | 'minReps' | 'maxReps' | 'weight' | 'rir',
		value: string | number | null,
	) => void
	onValidateMinMaxReps: (
		exerciseIndex: number,
		setIndex: number,
		field: 'minReps' | 'maxReps',
	) => void
	weightUnit: WeightUnit
}

export const useSetRowInputs = ({
	set,
	exerciseIndex,
	setIndex,
	onUpdateSet,
	onValidateMinMaxReps,
	weightUnit,
}: UseSetRowInputsOptions) => {
	const [minInput, setMinInput] = useState<string>(
		set.minReps !== null && set.minReps !== undefined
			? String(set.minReps)
			: '',
	)
	const [maxInput, setMaxInput] = useState<string>(
		set.maxReps !== null && set.maxReps !== undefined
			? String(set.maxReps)
			: '',
	)
	const [weightInput, setWeightInput] = useState<string>(
		formatWeightInput(set.weight, weightUnit),
	)
	const [rirInput, setRirInput] = useState<string>(
		set.rir !== undefined && set.rir !== null ? String(set.rir) : '',
	)

	useEffect(() => {
		setMinInput(
			set.minReps !== null && set.minReps !== undefined
				? String(set.minReps)
				: '',
		)
	}, [set.minReps])

	useEffect(() => {
		setMaxInput(
			set.maxReps !== null && set.maxReps !== undefined
				? String(set.maxReps)
				: '',
		)
	}, [set.maxReps])

	useEffect(() => {
		setWeightInput(formatWeightInput(set.weight, weightUnit))
	}, [set.weight, weightUnit])

	useEffect(() => {
		setRirInput(
			set.rir !== undefined && set.rir !== null ? String(set.rir) : '',
		)
	}, [set.rir])

	const handleFixedRepsChange = useCallback(
		(value: string) => {
			const sanitized = sanitizeIntegerInput(value)
			onUpdateSet(exerciseIndex, setIndex, 'reps', sanitized)
		},
		[exerciseIndex, onUpdateSet, setIndex],
	)

	const handleMinChange = useCallback(
		(value: string) => {
			const sanitized = sanitizeIntegerInput(value)
			setMinInput(sanitized)
			onUpdateSet(
				exerciseIndex,
				setIndex,
				'minReps',
				sanitized === '' ? '' : sanitized,
			)
		},
		[exerciseIndex, onUpdateSet, setIndex],
	)

	const handleMinBlur = useCallback(() => {
		onValidateMinMaxReps(exerciseIndex, setIndex, 'minReps')
	}, [exerciseIndex, onValidateMinMaxReps, setIndex])

	const handleMaxChange = useCallback(
		(value: string) => {
			const sanitized = sanitizeIntegerInput(value)
			setMaxInput(sanitized)
			onUpdateSet(
				exerciseIndex,
				setIndex,
				'maxReps',
				sanitized === '' ? '' : sanitized,
			)
		},
		[exerciseIndex, onUpdateSet, setIndex],
	)

	const handleMaxBlur = useCallback(() => {
		onValidateMinMaxReps(exerciseIndex, setIndex, 'maxReps')
	}, [exerciseIndex, onValidateMinMaxReps, setIndex])

	const handleWeightChange = useCallback((value: string) => {
		const sanitized = sanitizeDecimalInput(value)
		setWeightInput(sanitized)
	}, [])

	const handleWeightBlur = useCallback(() => {
		const trimmed = weightInput.trim()
		if (trimmed === '') {
			onUpdateSet(exerciseIndex, setIndex, 'weight', '')
			setWeightInput('')
			return
		}

		const currentDisplay = formatWeightInput(set.weight, weightUnit)
		if (trimmed === currentDisplay) return

		const parsed = parseOptionalPositiveFloat(trimmed)
		const parsedKg =
			parsed === undefined
				? undefined
				: parseWeightInput(String(parsed), weightUnit)
		if (parsedKg !== undefined) {
			onUpdateSet(exerciseIndex, setIndex, 'weight', String(parsedKg))
			setWeightInput(formatWeightInput(parsedKg, weightUnit))
			return
		}

		setWeightInput(formatWeightInput(set.weight, weightUnit))
	}, [
		exerciseIndex,
		set.weight,
		setIndex,
		weightInput,
		onUpdateSet,
		weightUnit,
	])

	const handleRirChange = useCallback(
		(value: string) => {
			const sanitized = sanitizeIntegerInput(value)
			setRirInput(sanitized)
			if (sanitized === '') {
				onUpdateSet(exerciseIndex, setIndex, 'rir', null)
				return
			}
			const parsed = parseInt(sanitized, 10)
			onUpdateSet(
				exerciseIndex,
				setIndex,
				'rir',
				Number.isNaN(parsed) ? null : parsed,
			)
		},
		[exerciseIndex, onUpdateSet, setIndex],
	)

	return {
		minInput,
		maxInput,
		weightInput,
		rirInput,
		handleFixedRepsChange,
		handleMinChange,
		handleMinBlur,
		handleMaxChange,
		handleMaxBlur,
		handleWeightChange,
		handleWeightBlur,
		handleRirChange,
	}
}
