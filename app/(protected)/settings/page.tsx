'use client'

import type { WeightUnit } from '@sunsteel/contracts'
import { Camera, Loader2 } from 'lucide-react'
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
import { useToast } from '@/components/ui/toast'
import { TrainingLocationPreferencesCard } from '@/features/settings/training-location-preferences-card'
import { useUpdateUser } from '@/lib/api/hooks/useUpdateUser'
import { useUser } from '@/lib/api/hooks/useUser'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { formatWeightInput, parseWeightInput } from '@/lib/utils/weight-unit'

interface SettingsFormData {
	name: string
	lastName: string
	age: string
	sex: string
	weight: string
	height: string
	weightUnit: WeightUnit
}

export default function SettingsPage() {
	const { user, isLoading } = useUser()
	const updateUserMutation = useUpdateUser()
	const { push } = useToast()

	const [formData, setFormData] = useState<SettingsFormData>({
		name: '',
		lastName: '',
		age: '',
		sex: '',
		weight: '',
		height: '',
		weightUnit: 'KG',
	})

	const [avatarUrl, setAvatarUrl] = useState('')
	const [uploading, setUploading] = useState(false)

	const [cropperOpen, setCropperOpen] = useState(false)
	const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null)

	useEffect(() => {
		if (user) {
			setFormData({
				name: user.name || '',
				lastName: user.lastName || '',
				age: user.age ? String(user.age) : '',
				sex: user.sex || '',
				weight: formatWeightInput(user.weight, user.weightUnit),
				height: user.height ? String(user.height) : '',
				weightUnit: user.weightUnit,
			})
			setAvatarUrl(user.avatarUrl || '')
		}
	}, [user])

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
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
				throw new Error('Image size must be less than 2MB.')
			}

			if (!file.type.startsWith('image/')) {
				throw new Error('Please upload a valid image file.')
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
				title: 'Error',
				description: (error as Error).message || 'Error selecting image.',
				variant: 'destructive',
			})
		}
	}

	const handleCroppedImageUpload = async (file: File) => {
		try {
			setUploading(true)

			const fileExt = file.name.split('.').pop() || 'jpeg'
			const fileName = `${user?.id}-${Math.random()}.${fileExt}`
			const filePath = `${fileName}`

			const { error: uploadError } = await supabase.storage
				.from('avatars')
				.upload(filePath, file)

			if (uploadError) {
				throw uploadError
			}

			const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

			setAvatarUrl(data.publicUrl)

			updateUserMutation.mutate(
				{ avatarUrl: data.publicUrl },
				{
					onSuccess: () => {
						push({
							title: 'Avatar Updated',
							description: 'Your new profile picture has been saved.',
							variant: 'success',
						})
					},
				},
			)
		} catch (error: unknown) {
			logger.error('Error uploading avatar:', error)
			push({
				title: 'Error',
				description:
					(error as Error).message ||
					'Error uploading avatar. Are you sure the "avatars" bucket is public and created?',
				variant: 'destructive',
			})
		} finally {
			setUploading(false)
		}
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		const originalWeight = formatWeightInput(user?.weight, formData.weightUnit)
		const weightKg =
			formData.weight === originalWeight
				? (user?.weight ?? null)
				: (parseWeightInput(formData.weight, formData.weightUnit) ?? null)
		updateUserMutation.mutate(
			{
				name: formData.name,
				lastName: formData.lastName || null,
				age: formData.age ? parseInt(formData.age, 10) : null,
				sex: formData.sex ? (formData.sex as 'MALE' | 'FEMALE') : null,
				weight: weightKg,
				height: formData.height ? parseFloat(formData.height) : null,
				weightUnit: formData.weightUnit,
				avatarUrl: avatarUrl || null,
			},
			{
				onSuccess: () => {
					push({
						title: 'Success',
						description: 'Profile saved successfully.',
						variant: 'success',
					})
				},
				onError: err => {
					push({
						title: 'Error',
						description: 'Error saving profile: ' + err.message,
						variant: 'destructive',
					})
				},
			},
		)
	}

	if (isLoading) {
		return (
			<div className="flex justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin text-ink-3" />
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-4xl space-y-8">
			<div className="rule-heading pb-4">
				<h2 className="type-page corner-brackets inline-block text-foreground">
					Profile Settings
				</h2>
				<p className="mt-2 max-w-[68ch] text-sm text-ink-2 sm:text-base">
					Manage your account settings and set your preferences.
				</p>
			</div>

			<div className="grid items-start gap-6 md:grid-cols-[1fr_2fr]">
				<Card>
					<CardHeader>
						<CardTitle>Profile Picture</CardTitle>
						<CardDescription>Update your avatar</CardDescription>
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
							Click the image to upload a new avatar.
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Personal Information</CardTitle>
						<CardDescription>
							Update your personal details here.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="name">First Name</Label>
									<Input
										id="name"
										name="name"
										value={formData.name}
										onChange={handleInputChange}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="lastName">Last Name</Label>
									<Input
										id="lastName"
										name="lastName"
										value={formData.lastName}
										onChange={handleInputChange}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={user?.email || ''}
									disabled
									className="cursor-not-allowed"
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="age">Age</Label>
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
									<Label htmlFor="sex">Sex</Label>
									<Select
										value={formData.sex}
										onValueChange={val => handleSelectChange(val, 'sex')}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select sex" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="MALE">Male</SelectItem>
											<SelectItem value="FEMALE">Female</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label htmlFor="weight">
										Weight ({formData.weightUnit === 'LB' ? 'lb' : 'kg'})
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
									<Label htmlFor="weightUnit">Weight Unit</Label>
									<Select
										value={formData.weightUnit}
										onValueChange={value =>
											handleWeightUnitChange(value as WeightUnit)
										}
									>
										<SelectTrigger id="weightUnit" className="w-full">
											<SelectValue aria-label="Weight unit" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="KG">Kilograms (kg)</SelectItem>
											<SelectItem value="LB">Pounds (lb)</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="height">Height (cm)</Label>
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
									disabled={updateUserMutation.isPending}
									className="min-w-[120px]"
								>
									{updateUserMutation.isPending ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : null}
									Save Changes
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>

			<TrainingLocationPreferencesCard weightUnit={formData.weightUnit} />

			<ImageCropper
				open={cropperOpen}
				onOpenChange={setCropperOpen}
				imageSrc={selectedImageSrc}
				onCropComplete={handleCroppedImageUpload}
			/>
		</div>
	)
}
