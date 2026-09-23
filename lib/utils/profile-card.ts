import type {
	FeaturedProfileItem,
	PublicProfileAchievements,
	WeightUnit,
} from '@sunsteel/contracts'

import { rankCrestTier } from '@/lib/utils/rank-identity'
import { describeRoutineSummary } from '@/lib/utils/routine-sharing'
import { formatWeight } from '@/lib/utils/weight-unit'

const CARD_WIDTH = 1200
const CARD_HEIGHT = 1500
const CARD_PADDING = 96

export interface ProfileCardAccomplishment {
	kind: 'Achievement' | 'Personal record' | 'Routine'
	title: string
	detail: string
}

export interface ProfileCardModel {
	displayName: string
	username: string
	profileUrl: string
	rank: { id: string; title: string } | null
	accomplishments: ProfileCardAccomplishment[]
}

interface ProfileCardSource {
	name: string
	lastName?: string | null
	username: string
	profileUrl: string
	featuredItems: FeaturedProfileItem[]
	achievements?: PublicProfileAchievements
	weightUnit: WeightUnit
}

interface ProfileCardPalette {
	background: string
	surface: string
	foreground: string
	ink2: string
	ink3: string
	rule: string
	ruleFaint: string
	rank: string
}

const CREST_SHIELD =
	'M6.5 6C8.3 6.9 10.2 5.6 12 5.6C13.8 5.6 15.7 6.9 17.5 6C16.8 8.3 16.6 9.7 17.2 12C17.9 15 16.6 19 12 21.4C7.4 19 6.1 15 6.8 12C7.4 9.7 7.2 8.3 6.5 6Z'
const CREST_SPRIG_STEM = 'M14 23.6C7.2 23.2 2.6 19 2.7 12.8'
const CREST_SPRIG_STEM_FULL = `${CREST_SPRIG_STEM}C2.8 9.6 3.6 7.2 5.4 5.2`
const CREST_SPRIG_LEAVES =
	'M6.78 21.22Q5.33 20.52 3.99 21.42Q5.44 22.12 6.78 21.22ZM4.13 18.36Q3.06 17.15 1.48 17.46Q2.55 18.67 4.13 18.36ZM2.86 14.94Q2.3 13.43 0.72 13.14Q1.28 14.66 2.86 14.94Z'
const CREST_SPRIG_TIP = 'M2.7 12.8Q3.52 11.41 2.75 10Q1.92 11.39 2.7 12.8Z'
const CREST_SPRIG_LEAVES_FULL =
	'M3.08 9.72Q3.09 8.08 1.76 7.13Q1.75 8.77 3.08 9.72ZM4.44 6.45Q5 4.92 4.08 3.57Q3.51 5.11 4.44 6.45ZM5.4 5.2Q6.93 4.69 7.27 3.12Q5.74 3.62 5.4 5.2Z'
const CREST_STAR =
	'M12 0.6L12.47 1.85L13.81 1.91L12.76 2.75L13.12 4.04L12 3.3L10.88 4.04L11.24 2.75L10.19 1.91L11.53 1.85Z'
const CREST_CROWN = 'M7.6 4.5L7 1.9L9.6 3.2L12 1.3L14.4 3.2L17 1.9L16.4 4.5Z'

function normalizeText(value: string): string {
	return value.replace(/\s+/g, ' ').trim()
}

function featuredItemToAccomplishment(
	item: FeaturedProfileItem,
	weightUnit: WeightUnit,
): ProfileCardAccomplishment | null {
	if (item.kind === 'RANK') return null
	if (item.kind === 'ACHIEVEMENT') {
		return {
			kind: 'Achievement',
			title: item.achievement.title,
			detail: item.achievement.description,
		}
	}
	if (item.kind === 'ROUTINE') {
		return {
			kind: 'Routine',
			title: item.routine.name,
			detail: describeRoutineSummary(item.routine),
		}
	}
	return {
		kind: 'Personal record',
		title: item.record.exerciseName,
		detail: `${formatWeight(item.record.weight, weightUnit)} for ${item.record.reps} reps · est. 1RM ${formatWeight(item.record.estimated1rm, weightUnit)}`,
	}
}

export function buildProfileCardModel({
	name,
	lastName,
	username,
	profileUrl,
	featuredItems,
	achievements,
	weightUnit,
}: ProfileCardSource): ProfileCardModel {
	const featuredRank = featuredItems.find(item => item.kind === 'RANK')
	const rank =
		achievements?.rank ??
		(featuredRank?.kind === 'RANK' ? featuredRank.rank : null)
	const displayName = normalizeText([name, lastName].filter(Boolean).join(' '))

	return {
		displayName: displayName || username,
		username,
		profileUrl,
		rank: rank ? { id: rank.id, title: rank.title } : null,
		accomplishments: featuredItems
			.map(item => featuredItemToAccomplishment(item, weightUnit))
			.filter((item): item is ProfileCardAccomplishment => item !== null),
	}
}

export function getProfileCardFilename(username: string): string {
	const safeUsername = username
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, '-')
		.replace(/^-+|-+$/g, '')
	return `sunnsteel-${safeUsername || 'member'}-profile-card.png`
}

function readCssToken(styles: CSSStyleDeclaration, name: string): string {
	const value = styles.getPropertyValue(name).trim()
	if (!value) throw new Error(`Missing profile-card colour token: ${name}`)
	return value
}

function readPalette(rankId?: string): ProfileCardPalette {
	const styles = getComputedStyle(document.documentElement)
	const rankToken = rankId ? `--rank-${rankId.toLowerCase()}` : '--ink-3'
	return {
		background: readCssToken(styles, '--background'),
		surface: readCssToken(styles, '--surface'),
		foreground: readCssToken(styles, '--foreground'),
		ink2: readCssToken(styles, '--ink-2'),
		ink3: readCssToken(styles, '--ink-3'),
		rule: readCssToken(styles, '--rule'),
		ruleFaint: readCssToken(styles, '--rule-faint'),
		rank: readCssToken(styles, rankToken),
	}
}

function fitText(
	context: CanvasRenderingContext2D,
	value: string,
	maxWidth: number,
): string {
	if (context.measureText(value).width <= maxWidth) return value
	let result = value
	while (result.length && context.measureText(`${result}…`).width > maxWidth) {
		result = result.slice(0, -1)
	}
	return `${result.trimEnd()}…`
}

function drawBrandMark(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	scale: number,
) {
	context.save()
	context.translate(x, y)
	context.scale(scale, scale)
	context.lineWidth = 2
	context.lineCap = 'butt'
	context.beginPath()
	context.arc(12, 7, 4.5, 0, Math.PI * 2)
	context.moveTo(3, 18)
	context.lineTo(21, 18)
	context.moveTo(8, 14)
	context.lineTo(8, 22)
	context.moveTo(16, 14)
	context.lineTo(16, 22)
	context.moveTo(4, 16)
	context.lineTo(4, 20)
	context.moveTo(20, 16)
	context.lineTo(20, 20)
	context.stroke()
	context.restore()
}

function crestSvg(rankId: string, color: string): string | null {
	const tier = rankCrestTier(rankId)
	if (tier < 0) return null
	const shield =
		tier === 0
			? `<path d="${CREST_SHIELD}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="13.4" r="1.4" fill="currentColor"/>`
			: tier === 1
				? `<path d="${CREST_SHIELD}" fill="currentColor" fill-opacity=".22" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 16.4L12 13.4L15 16.4" fill="none" stroke="currentColor" stroke-width="1.8"/>`
				: `<defs><mask id="crest"><path d="${CREST_SHIELD}" fill="white" stroke="white" stroke-width="1.6" stroke-linejoin="round"/><path d="${CREST_SHIELD}" fill="none" stroke="black" stroke-width="1.4" transform="translate(12 13.5) scale(.7) translate(-12 -13.5)"/><path d="M9.6 16L12 13.6L14.4 16" fill="none" stroke="black" stroke-width="1.6"/><circle cx="12" cy="10.4" r="1.1" fill="black"/></mask></defs><path d="${CREST_SHIELD}" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" mask="url(#crest)"/>`
	const sprig = (mirrored = false) =>
		`<g${mirrored ? ' transform="matrix(-1 0 0 1 24 0)"' : ''}><path d="${tier === 5 ? CREST_SPRIG_STEM_FULL : CREST_SPRIG_STEM}" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="${CREST_SPRIG_LEAVES}${tier === 5 ? CREST_SPRIG_LEAVES_FULL : CREST_SPRIG_TIP}" fill="currentColor"/></g>`
	const ornaments = `${tier >= 3 ? `${sprig()}${sprig(true)}<circle cx="12" cy="23.1" r=".9" fill="currentColor"/>` : ''}${tier === 4 ? `<path d="${CREST_STAR}" fill="currentColor"/>` : ''}${tier === 5 ? `<path d="${CREST_CROWN}" fill="currentColor"/><circle cx="7" cy="1.5" r=".7" fill="currentColor"/><circle cx="12" cy=".9" r=".7" fill="currentColor"/><circle cx="17" cy="1.5" r=".7" fill="currentColor"/>` : ''}`
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="color:${color}">${shield}${ornaments}</svg>`
}

async function drawRankCrest(
	context: CanvasRenderingContext2D,
	rankId: string,
	color: string,
	x: number,
	y: number,
	size: number,
) {
	const svg = crestSvg(rankId, color)
	if (!svg) return
	const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
	try {
		const image = new Image()
		await new Promise<void>((resolve, reject) => {
			image.onload = () => resolve()
			image.onerror = () => reject(new Error('Could not render rank crest'))
			image.src = url
		})
		context.drawImage(image, x, y, size, size)
	} finally {
		URL.revokeObjectURL(url)
	}
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(blob => {
			if (blob) resolve(blob)
			else reject(new Error('Could not create profile card image'))
		}, 'image/png')
	})
}

export async function createProfileCardPng(
	model: ProfileCardModel,
): Promise<Blob> {
	await document.fonts.ready
	const palette = readPalette(model.rank?.id)
	const canvas = document.createElement('canvas')
	canvas.width = CARD_WIDTH
	canvas.height = CARD_HEIGHT
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Canvas is unavailable')

	context.fillStyle = palette.background
	context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
	context.strokeStyle = palette.foreground
	context.fillStyle = palette.foreground
	drawBrandMark(context, CARD_PADDING, 66, 2.7)
	context.font = '600 39px Cinzel, Georgia, serif'
	context.letterSpacing = '5px'
	context.fillText('SUNNSTEEL', 185, 116)
	context.letterSpacing = '0px'
	context.font = '500 24px Oswald, sans-serif'
	context.fillStyle = palette.ink3
	context.fillText('PUBLIC TRAINING LEDGER', CARD_PADDING, 167)

	context.strokeStyle = palette.rule
	context.lineWidth = 2
	context.beginPath()
	context.moveTo(CARD_PADDING, 202)
	context.lineTo(CARD_WIDTH - CARD_PADDING, 202)
	context.moveTo(CARD_PADDING, 210)
	context.lineTo(CARD_WIDTH - CARD_PADDING, 210)
	context.stroke()

	context.fillStyle = palette.foreground
	context.font = '600 62px Cinzel, Georgia, serif'
	context.fillText(
		fitText(context, model.displayName, CARD_WIDTH - CARD_PADDING * 2),
		CARD_PADDING,
		315,
	)
	context.fillStyle = palette.ink3
	context.font = '400 27px "Space Mono", monospace'
	context.fillText(`@${model.username}`, CARD_PADDING, 365)

	context.fillStyle = palette.surface
	context.fillRect(CARD_PADDING, 430, CARD_WIDTH - CARD_PADDING * 2, 200)
	context.strokeStyle = palette.ruleFaint
	context.strokeRect(CARD_PADDING, 430, CARD_WIDTH - CARD_PADDING * 2, 200)
	if (model.rank) {
		await drawRankCrest(context, model.rank.id, palette.rank, 126, 466, 128)
	}
	context.fillStyle = palette.ink3
	context.font = '500 23px Oswald, sans-serif'
	context.fillText('CURRENT RENAISSANCE RANK', model.rank ? 296 : 132, 502)
	context.fillStyle = palette.foreground
	context.font = '600 43px Cinzel, Georgia, serif'
	context.fillText(
		model.rank?.title ?? 'Not yet earned',
		model.rank ? 296 : 132,
		560,
	)
	context.fillStyle = palette.ink2
	context.font = '400 24px Oswald, sans-serif'
	context.fillText(
		model.rank
			? 'Verified through completed training.'
			: 'Complete training to begin the rank journey.',
		model.rank ? 296 : 132,
		598,
	)

	context.fillStyle = palette.ink3
	context.font = '500 23px Oswald, sans-serif'
	context.fillText('FEATURED ACCOMPLISHMENTS', CARD_PADDING, 708)
	context.strokeStyle = palette.rule
	context.beginPath()
	context.moveTo(CARD_PADDING, 730)
	context.lineTo(CARD_WIDTH - CARD_PADDING, 730)
	context.stroke()

	if (!model.accomplishments.length) {
		context.fillStyle = palette.ink3
		context.font = '400 27px Oswald, sans-serif'
		context.fillText(
			'No public accomplishments selected yet.',
			CARD_PADDING,
			805,
		)
	} else {
		model.accomplishments.forEach((item, index) => {
			const y = 780 + index * 94
			context.fillStyle = palette.ink3
			context.font = '500 20px Oswald, sans-serif'
			context.fillText(item.kind.toUpperCase(), CARD_PADDING, y)
			context.fillStyle = palette.foreground
			context.font = '600 29px Oswald, sans-serif'
			context.fillText(
				fitText(context, normalizeText(item.title), 430),
				CARD_PADDING,
				y + 37,
			)
			context.fillStyle = palette.ink2
			context.font = '400 23px Oswald, sans-serif'
			context.fillText(
				fitText(context, normalizeText(item.detail), 505),
				CARD_WIDTH - CARD_PADDING - 505,
				y + 37,
			)
			context.strokeStyle = palette.ruleFaint
			context.beginPath()
			context.moveTo(CARD_PADDING, y + 62)
			context.lineTo(CARD_WIDTH - CARD_PADDING, y + 62)
			context.stroke()
		})
	}

	context.fillStyle = palette.ink3
	context.font = '400 21px "Space Mono", monospace'
	context.fillText(
		fitText(context, model.profileUrl, CARD_WIDTH - CARD_PADDING * 2),
		CARD_PADDING,
		1422,
	)
	context.fillStyle = palette.ink2
	context.font = '400 22px Oswald, sans-serif'
	context.textAlign = 'right'
	context.fillText(
		'Verified training · Publicly shared',
		CARD_WIDTH - CARD_PADDING,
		1460,
	)

	return canvasToPng(canvas)
}

export async function shareProfileCard(
	model: ProfileCardModel,
): Promise<'shared' | 'downloaded'> {
	const blob = await createProfileCardPng(model)
	const filename = getProfileCardFilename(model.username)
	const file = new File([blob], filename, { type: 'image/png' })
	if (
		typeof navigator.share === 'function' &&
		typeof navigator.canShare === 'function' &&
		navigator.canShare({ files: [file] })
	) {
		await navigator.share({
			title: `${model.displayName} on Sunnsteel`,
			text: `See @${model.username}'s public training profile.`,
			files: [file],
		})
		return 'shared'
	}

	const url = URL.createObjectURL(blob)
	try {
		const link = document.createElement('a')
		link.href = url
		link.download = filename
		link.click()
	} finally {
		setTimeout(() => URL.revokeObjectURL(url), 0)
	}
	return 'downloaded'
}
