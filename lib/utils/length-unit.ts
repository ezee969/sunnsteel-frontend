import {
	cmToFeetInches,
	cmToInches,
	feetInchesToCm,
	inchesToCm,
	LENGTH_UNITS,
	type LengthUnit,
} from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import { numberFormatter } from '@/i18n/date-locale'

/**
 * PREF-04: lengths are stored in centimetres, as weights are stored in
 * kilograms; this is the display and entry boundary for `CM`/`IN`, the twin
 * of `weight-unit.ts`. A height reads in feet and inches when imperial, every
 * other length in inches.
 */

export function isLengthUnit(value: unknown): value is LengthUnit {
	return (LENGTH_UNITS as readonly unknown[]).includes(value)
}

export function getLengthUnitLabel(unit: LengthUnit): 'cm' | 'in' {
	return unit === 'IN' ? 'in' : 'cm'
}

export function centimetresToDisplayLength(
	cm: number,
	unit: LengthUnit,
): number {
	return unit === 'IN' ? cmToInches(cm) : cm
}

export function displayLengthToCentimetres(
	length: number,
	unit: LengthUnit,
): number {
	return unit === 'IN' ? inchesToCm(length) : length
}

/** What a length field shows: machine syntax, read back by `parseLengthInput`. */
export function formatLengthInput(
	cm: number | null | undefined,
	unit: LengthUnit,
): string {
	if (cm === null || cm === undefined) return ''
	return String(centimetresToDisplayLength(cm, unit))
}

export function parseLengthInput(
	value: string,
	unit: LengthUnit,
): number | undefined {
	const trimmed = value.trim()
	if (trimmed === '') return undefined
	const parsed = Number(trimmed)
	if (!Number.isFinite(parsed) || parsed < 0) return undefined
	return displayLengthToCentimetres(parsed, unit)
}

/** "182 cm", or "6 ft 0 in" when imperial; null reads as a dash. */
export function formatHeight(
	cm: number | null | undefined,
	unit: LengthUnit,
	locale: Locale,
): string {
	if (!cm) return '—'
	const format = numberFormatter(locale, {
		maximumFractionDigits: 1,
		useGrouping: false,
	})
	if (unit === 'IN') {
		const { feet, inches } = cmToFeetInches(cm)
		return `${format.format(feet)} ft ${format.format(inches)} in`
	}
	return `${format.format(cm)} cm`
}

/**
 * A height as the Settings form holds it: one field in centimetres, or feet
 * and inches. Text, because a field is text until it is saved.
 */
export interface HeightDraft {
	cm: string
	feet: string
	inches: string
}

export function heightDraft(
	cm: number | null | undefined,
	unit: LengthUnit,
): HeightDraft {
	if (cm === null || cm === undefined || cm === 0) {
		return { cm: '', feet: '', inches: '' }
	}
	if (unit === 'IN') {
		const { feet, inches } = cmToFeetInches(cm)
		return { cm: '', feet: String(feet), inches: String(inches) }
	}
	return { cm: String(cm), feet: '', inches: '' }
}

const sameDraft = (left: HeightDraft, right: HeightDraft) =>
	left.cm.trim() === right.cm.trim() &&
	left.feet.trim() === right.feet.trim() &&
	left.inches.trim() === right.inches.trim()

/**
 * The height to save in centimetres: null when every field is empty,
 * undefined when what was typed is not a height. **An untouched height is
 * sent back exactly as stored**, as an untouched pound weight is, so a value
 * rounded for the fields never comes back as a change nobody made.
 */
export function heightFromDraft(
	draft: HeightDraft,
	unit: LengthUnit,
	stored: number | null | undefined,
): number | null | undefined {
	if (stored != null && sameDraft(draft, heightDraft(stored, unit))) {
		return stored
	}
	if (unit === 'CM') {
		const text = draft.cm.trim()
		if (text === '') return null
		const cm = Number(text)
		return Number.isFinite(cm) && cm >= 0 ? cm : undefined
	}
	const feetText = draft.feet.trim()
	const inchesText = draft.inches.trim()
	if (feetText === '' && inchesText === '') return null
	const feet = feetText === '' ? 0 : Number(feetText)
	const inches = inchesText === '' ? 0 : Number(inchesText)
	if (
		!Number.isFinite(feet) ||
		!Number.isFinite(inches) ||
		feet < 0 ||
		inches < 0 ||
		!Number.isInteger(feet)
	) {
		return undefined
	}
	return feetInchesToCm(feet, inches)
}

/** The same height in the other unit when the member switches it. */
export function convertHeightDraft(
	draft: HeightDraft,
	from: LengthUnit,
	to: LengthUnit,
	stored: number | null | undefined,
): HeightDraft {
	if (from === to) return draft
	const cm = heightFromDraft(draft, from, stored)
	// Something that is not a height yet stays as typed rather than vanishing.
	if (cm === undefined) return draft
	return heightDraft(cm, to)
}
