'use client'

import {
	PROFILE_BIO_MAX_LENGTH,
	PROFILE_LOCATION_MAX_LENGTH,
	type WeightUnit,
} from '@sunsteel/contracts'
import { Camera, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { ImageCropper } from '@/components/ui/image-cropper'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { FeaturedRecordsSettingsCard } from '@/features/settings/featured-records-settings-card'
import { SettingsTab } from '@/features/settings/settings-tab'
import { TrainingIdentitySettingsCard } from '@/features/settings/training-identity-settings-card'
import { useHashForward } from '@/hooks/use-hash-forward'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { useUpdateUser } from '@/lib/api/hooks/useUpdateUser'
import { useUploadAvatar } from '@/lib/api/hooks/useUploadAvatar'
import { useUser } from '@/lib/api/hooks/useUser'
import { logger } from '@/lib/utils/logger'
import { localDateKey } from '@/lib/utils/schedule-week'
import { privacySettingHref } from '@/lib/utils/settings-anchor'
import { SETTINGS_HASH_RULES } from '@/lib/utils/settings-tabs'
import {
	getUsernameValidationError,
	normalizeUsername,
} from '@/lib/utils/username'
import { formatWeightInput, parseWeightInput } from '@/lib/utils/weight-unit'

interface SettingsFormData {
	username: string
	name: string
	lastName: string
	bio: string
	location: string
	age: string
	sex: string
	weight: string
	height: string
	weightUnit: WeightUnit
}

/**
 * Settings › Profile (UX-12): the picture, the profile form with its one
 * Save, training identity and featured accomplishments. An old `/settings#…`
 * link to a card that moved is sent to its tab before anything renders.
 */
export default function SettingsProfilePage() {
	const t = useTranslations('settings.profilePage')
	const tUsername = useTranslations('settings.username')
	const forwarding = useHashForward(SETTINGS_HASH_RULES)
	const { user } = useUser()
	// The saved unit, not the form's unsaved choice: featured records are
	// shown as the profile shows them.
	const savedWeightUnit = useWeightUnit()
	const updateUserMutation = useUpdateUser()
	const { push } = useToast()

	const [formData, setFormData] = useState<SettingsFormData>({
		username: '',
		name: '',
		lastName: '',
		bio: '',
		location: '',
		age: '',
		sex: '',
		weight: '',
		height: '',
		weightUnit: 'KG',
	})

	const [avatarUrl, setAvatarUrl] = useState('')
	const uploadAvatar = useUploadAvatar()
	const uploading = uploadAvatar.isPending

	const [cropperOpen, setCropperOpen] = useState(false)
	const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null)

	useEffect(() => {
		if (user) {
			setFormData({
				username: user.username || '',
				name: user.name || '',
				lastName: user.lastName || '',
				bio: user.bio || '',
				location: user.location || '',
				age: user.age ? String(user.age) : '',
				sex: user.sex || '',
				weight: formatWeightInput(user.weight, user.weightUnit),
				height: user.height ? String(user.height) : '',
				weightUnit: user.weightUnit,
			})
			setAvatarUrl(user.avatarUrl || '')
		}
	}, [user])

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const value =
			e.target.name === 'username'
				? e.target.value.replace(/^@/, '').toLowerCase()
				: e.target.value
		setFormData(prev => ({ ...prev, [e.target.name]: value }))
	}

	const handleSelectChange = (val: string, name: string) => {
		setFormData(prev => ({ ...prev, [name]: val }))
	}

	const handleWeightUnitChange = (weightUnit: WeightUnit) => {
		setFormData(previous => {
			const currentWeightKg = parseWeightInput(
				previous.weight,
				previous.weightUnit,
			)
			return {
				...previous,
				weightUnit,
				weight: formatWeightInput(currentWeightKg, weightUnit),
			}
		})
	}

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		try {
			if (!event.target.files || event.target.files.length === 0) {
				return
			}
			const file = event.target.files[0]

			if (file.size > 2 * 1024 * 1024) {
				throw new Error(t('imageTooLarge'))
			}

			if (!file.type.startsWith('image/')) {
				throw new Error(t('imageInvalid'))
			}

			const reader = new FileReader()
			reader.addEventListener('load', () => {
				setSelectedImageSrc(reader.result?.toString() || null)
				setCropperOpen(true)
			})
			reader.readAsDataURL(file)

			// Reset input value so selecting the same file again works
			event.target.value = ''
		} catch (error: unknown) {
			logger.error('Error selecting image:', error)
			push({
				title: t('errorTitle'),
				description: (error as Error).message || t('selectFallback'),
				variant: 'destructive',
			})
		}
	}

	const handleCroppedImageUpload = (file: File) => {
		uploadAvatar.mutate(file, {
			onSuccess: profile => {
				setAvatarUrl(profile.avatarUrl || '')
				push({
					title: t('avatarUpdatedTitle'),
					description: t('avatarUpdatedDescription'),
					variant: 'success',
				})
			},
			onError: error => {
				logger.error('Error uploading avatar:', error)
				push({
					title: t('photoNotChanged'),
					description: error.message,
					variant: 'destructive',
				})
			},
		})
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		const usernameError = getUsernameValidationError(
			formData.username,
			tUsername,
		)
		if (usernameError) {
			push({
				title: t('chooseUsername'),
				description: usernameError,
				variant: 'destructive',
			})
			return
		}
		const originalWeight = formatWeightInput(user?.weight, formData.weightUnit)
		const weightKg =
			formData.weight === originalWeight
				? (user?.weight ?? null)
				: (parseWeightInput(formData.weight, formData.weightUnit) ?? null)
		updateUserMutation.mutate(
			{
				username: normalizeUsername(formData.username),
				name: formData.name,
				lastName: formData.lastName || null,
				bio: formData.bio || null,
				location: formData.location || null,
				age: formData.age ? parseInt(formData.age, 10) : null,
				sex: formData.sex ? (formData.sex as 'MALE' | 'FEMALE') : null,
				weight: weightKg,
				// PROG-12: a changed weight becomes this local date's body measurement.
				localDate: localDateKey(new Date()),
				height: formData.height ? parseFloat(formData.height) : null,
				weightUnit: formData.weightUnit,
				avatarUrl: avatarUrl || null,
			},
			{
				onSuccess: () => {
					push({
						title: t('successTitle'),
						description: t('profileSaved'),
						variant: 'success',
					})
				},
				onError: err => {
					push({
						title: t('errorTitle'),
						description: t('saveError', { message: err.message }),
						variant: 'destructive',
					})
				},
			},
		)
	}

	if (forwarding) return null

	const usernameError = getUsernameValidationError(formData.username, tUsername)

	return (
		<SettingsTab>
			<div className="grid items-start gap-6 lg:grid-cols-[1fr_2fr]">
				<Card>
					<CardHeader>
						<CardTitle>{t('pictureTitle')}</CardTitle>
						<CardDescription>{t('pictureDescription')}</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col items-center gap-4">
						<div className="relative group">
							<Avatar className="h-32 w-32 border border-rule">
								<AvatarImage src={avatarUrl || ''} className="object-cover" />
								<AvatarFallback className="type-numeral bg-surface-sunk text-ink-2">
									{user?.name?.charAt(0)}
								</AvatarFallback>
							</Avatar>
							<label
								htmlFor="avatar-upload"
								className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-foreground/70 text-background opacity-0 transition-opacity duration-[var(--motion-fast)] ease-standard group-hover:opacity-100"
							>
								{uploading ? (
									<Loader2 className="h-6 w-6 animate-spin" />
								) : (
									<Camera className="h-8 w-8" />
								)}
							</label>
							<input
								id="avatar-upload"
								type="file"
								accept="image/*"
								className="hidden"
								onChange={handleFileSelect}
								disabled={uploading}
							/>
						</div>
						<p className="type-body-sm text-center text-ink-3">
							{t('clickToUpload')}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{t('personalTitle')}</CardTitle>
						<CardDescription>{t('personalDescription')}</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="username">{t('username')}</Label>
								<div className="relative max-w-[var(--field-max)]">
									<span
										className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
										aria-hidden
									>
										@
									</span>
									<Input
										id="username"
										name="username"
										value={formData.username}
										onChange={handleInputChange}
										className="pl-8"
										autoCapitalize="none"
										autoCorrect="off"
										spellCheck={false}
										maxLength={30}
										aria-invalid={Boolean(usernameError)}
										aria-describedby="username-help"
										required
									/>
								</div>
								<p
									id="username-help"
									className={`type-body-sm ${
										usernameError ? 'text-destructive' : 'text-ink-3'
									}`}
								>
									{usernameError || t('usernameHelp')}
								</p>
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="name">{t('firstName')}</Label>
									<Input
										id="name"
										name="name"
										value={formData.name}
										onChange={handleInputChange}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="lastName">{t('lastName')}</Label>
									<Input
										id="lastName"
										name="lastName"
										value={formData.lastName}
										onChange={handleInputChange}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="email">{t('email')}</Label>
								<Input
									id="email"
									type="email"
									value={user?.email || ''}
									disabled
									className="cursor-not-allowed"
								/>
							</div>

							<div className="space-y-2">
								<div className="flex items-baseline justify-between gap-3">
									<Label htmlFor="location">{t('location')}</Label>
									<span className="type-data text-xs text-ink-3">
										{formData.location.length}/{PROFILE_LOCATION_MAX_LENGTH}
									</span>
								</div>
								<Input
									id="location"
									name="location"
									value={formData.location}
									onChange={handleInputChange}
									maxLength={PROFILE_LOCATION_MAX_LENGTH}
									placeholder={t('locationPlaceholder')}
									autoComplete="address-level2"
								/>
								<p className="type-body-sm text-ink-3">
									{t.rich('locationHint', {
										link: chunks => (
											<Link
												href={privacySettingHref('location')}
												className="text-foreground underline underline-offset-4"
											>
												{chunks}
											</Link>
										),
									})}
								</p>
							</div>

							<div className="space-y-2">
								<div className="flex items-baseline justify-between gap-3">
									<Label htmlFor="bio">{t('biography')}</Label>
									<span className="type-data text-xs text-ink-3">
										{formData.bio.length}/{PROFILE_BIO_MAX_LENGTH}
									</span>
								</div>
								<Textarea
									id="bio"
									name="bio"
									value={formData.bio}
									onChange={handleInputChange}
									maxLength={PROFILE_BIO_MAX_LENGTH}
									placeholder={t('bioPlaceholder')}
									className="min-h-28 resize-y"
								/>
								<p className="type-body-sm text-ink-3">{t('bioHint')}</p>
							</div>

							<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="age">{t('age')}</Label>
									<Input
										id="age"
										name="age"
										className="max-w-[var(--field-max)]"
										type="number"
										min="10"
										max="120"
										value={formData.age}
										onChange={handleInputChange}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="sex">{t('sex')}</Label>
									<Select
										value={formData.sex}
										onValueChange={val => handleSelectChange(val, 'sex')}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder={t('sexPlaceholder')} />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="MALE">{t('male')}</SelectItem>
											<SelectItem value="FEMALE">{t('female')}</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
								<div className="space-y-2">
									<Label htmlFor="weight">
										{t('weight', {
											unit: formData.weightUnit === 'LB' ? 'lb' : 'kg',
										})}
									</Label>
									<Input
										id="weight"
										name="weight"
										className="max-w-[var(--field-max)]"
										type="number"
										step="0.1"
										value={formData.weight}
										onChange={handleInputChange}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="weightUnit">{t('weightUnit')}</Label>
									<Select
										value={formData.weightUnit}
										onValueChange={value =>
											handleWeightUnitChange(value as WeightUnit)
										}
									>
										<SelectTrigger id="weightUnit" className="w-full">
											<SelectValue aria-label={t('weightUnitAria')} />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="KG">{t('kilograms')}</SelectItem>
											<SelectItem value="LB">{t('pounds')}</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="height">{t('height')}</Label>
									<Input
										id="height"
										name="height"
										className="max-w-[var(--field-max)]"
										type="number"
										step="0.1"
										value={formData.height}
										onChange={handleInputChange}
									/>
								</div>
							</div>

							<div className="pt-4 flex justify-end">
								<Button
									type="submit"
									disabled={
										updateUserMutation.isPending || Boolean(usernameError)
									}
									className="min-w-[120px]"
								>
									{updateUserMutation.isPending ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : null}
									{t('save')}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>

			{user ? (
				<TrainingIdentitySettingsCard identity={user.trainingIdentity} />
			) : null}

			{user ? (
				<FeaturedRecordsSettingsCard
					username={user.username}
					weightUnit={savedWeightUnit}
					accountRoutinesRule={user.privacySettings.routines}
				/>
			) : null}

			<ImageCropper
				open={cropperOpen}
				onOpenChange={setCropperOpen}
				imageSrc={selectedImageSrc}
				onCropComplete={handleCroppedImageUpload}
			/>
		</SettingsTab>
	)
}
