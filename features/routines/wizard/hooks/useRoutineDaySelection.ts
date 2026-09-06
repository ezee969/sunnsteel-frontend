'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Exercise } from '@/lib/api/types'

interface UseRoutineDaySelectionParams {
	exercises?: Exercise[]
	trainingDays: number[]
}

/**
 * Manages state for selecting a routine day and filtering exercises for a day picker UI.
 *
 * Keeps a selected day index clamped to the provided trainingDays array, controls a dropdown picker (open/close/toggle),
 * closes the picker when clicks occur outside its container, and provides a searchable, memoized list of exercises.
 *
 * @param exercises - Optional list of exercises to filter; each exercise's `name`, `equipment`, and `primaryMuscles` are used for search matches.
 * @param trainingDays - Array representing available training days; `selectedDay` is clamped to the valid indices of this array.
 * @returns An object containing:
 *  - `selectedDay`: the current selected day index.
 *  - `setSelectedDay`: setter for the selected day index.
 *  - `dropdownRef`: ref to attach to the dropdown container for outside-click detection.
 *  - `picker`: an object with:
 *      - `isOpen`: whether the picker dropdown is open.
 *      - `open`: opens the picker.
 *      - `close`: closes the picker.
 *      - `toggle`: toggles the picker's open state.
 *      - `searchValue`: the current search string.
 *      - `setSearchValue`: setter for the search string.
 *      - `filteredExercises`: exercises filtered by `searchValue` (matches `name`, `equipment`, or any `primaryMuscles`, case-insensitive).
 */
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

	// Close picker when clicking outside
	useEffect(() => {
		if (!isPickerOpen) return

		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setPickerOpen(false)
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
			close: () => setPickerOpen(false),
			toggle: () => setPickerOpen((prev) => !prev),
			searchValue,
			setSearchValue,
			filteredExercises,
		},
	}
}
