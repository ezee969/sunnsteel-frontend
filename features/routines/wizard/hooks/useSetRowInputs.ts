import { useCallback, useEffect, useState } from 'react'
import type { RoutineSet } from '../types'
import {
	sanitizeDecimalInput,
	sanitizeIntegerInput,
	parseOptionalPositiveFloat,
} from '../utils/validation.helpers'

interface UseSetRowInputsOptions {
	set: RoutineSet
	exerciseIndex: number
	setIndex: number
	onUpdateSet: (
		exerciseIndex: number,
		setIndex: number,
		field: 'repType' | 'reps' | 'minReps' | 'maxReps' | 'weight',
		value: string,
	) => void
	onValidateMinMaxReps: (
		exerciseIndex: number,
		setIndex: number,
		field: 'minReps' | 'maxReps',
	) => void
}

export const useSetRowInputs = ({
	set,
	exerciseIndex,
	setIndex,
	onUpdateSet,
	onValidateMinMaxReps,
}: UseSetRowInputsOptions) => {
	const [minInput, setMinInput] = useState<string>(
		set.minReps !== null && set.minReps !== undefined ? String(set.minReps) : '',
	)
	const [maxInput, setMaxInput] = useState<string>(
		set.maxReps !== null && set.maxReps !== undefined ? String(set.maxReps) : '',
	)
	const [weightInput, setWeightInput] = useState<string>(
		set.weight !== undefined && set.weight !== null ? String(set.weight) : '',
	)

	useEffect(() => {
		setMinInput(set.minReps !== null && set.minReps !== undefined ? String(set.minReps) : '')
	}, [set.minReps])

	useEffect(() => {
		setMaxInput(set.maxReps !== null && set.maxReps !== undefined ? String(set.maxReps) : '')
	}, [set.maxReps])

	useEffect(() => {
		setWeightInput(set.weight !== undefined && set.weight !== null ? String(set.weight) : '')
	}, [set.weight])

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

		const parsed = parseOptionalPositiveFloat(trimmed)
		if (parsed !== undefined) {
			onUpdateSet(exerciseIndex, setIndex, 'weight', String(parsed))
			setWeightInput(String(parsed))
			return
		}

		setWeightInput(set.weight !== undefined && set.weight !== null ? String(set.weight) : '')
	}, [exerciseIndex, set.weight, setIndex, weightInput, onUpdateSet])

	return {
		minInput,
		maxInput,
		weightInput,
		handleFixedRepsChange,
		handleMinChange,
		handleMinBlur,
		handleMaxChange,
		handleMaxBlur,
		handleWeightChange,
		handleWeightBlur,
	}
}
