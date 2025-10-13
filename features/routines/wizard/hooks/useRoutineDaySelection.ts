'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Exercise } from '@/lib/api/types'

interface UseRoutineDaySelectionParams {
	exercises?: Exercise[]
	trainingDays: number[]
}

export function useRoutineDaySelection({
	exercises = [],
	trainingDays,
}: UseRoutineDaySelectionParams) {
	const [selectedDay, setSelectedDay] = useState(0)
	const [isPickerOpen, setPickerOpen] = useState(false)
	const [searchValue, setSearchValue] = useState('')
	const dropdownRef = useRef<HTMLDivElement>(null)

	// Clamp selected day when training days change
	useEffect(() => {
		if (trainingDays.length === 0) {
			setSelectedDay(0)
			return
		}

		setSelectedDay((prev) => {
			if (prev < trainingDays.length) return prev
			return Math.max(0, trainingDays.length - 1)
		})
	}, [trainingDays])

	const closePicker = () => {
		setPickerOpen(false)
		setSearchValue('')
	}

	// Close picker when clicking outside
	useEffect(() => {
		if (!isPickerOpen) return

		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				closePicker()
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [isPickerOpen])

	const filteredExercises = useMemo(() => {
		const searchLower = searchValue.trim().toLowerCase()
		if (!searchLower) return exercises

		return exercises.filter((exercise) => {
			if (exercise.name.toLowerCase().includes(searchLower)) return true
			if (exercise.equipment.toLowerCase().includes(searchLower)) return true
			return exercise.primaryMuscles.some((muscle) =>
				muscle.toLowerCase().includes(searchLower),
			)
		})
	}, [exercises, searchValue])

	return {
		selectedDay,
		setSelectedDay,
		dropdownRef,
		picker: {
			isOpen: isPickerOpen,
			open: () => setPickerOpen(true),
			close: closePicker,
			toggle: () => setPickerOpen((prev) => !prev),
			searchValue,
			setSearchValue,
			filteredExercises,
		},
	}
}
