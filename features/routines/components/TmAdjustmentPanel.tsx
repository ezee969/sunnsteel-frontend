import React, { useState, useEffect } from 'react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Plus, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { useCreateTmAdjustment, useGetTmAdjustmentSummary } from '@/lib/api/hooks'
import {
	TM_ADJUSTMENT_CONSTANTS,
	TmEventSummary,
} from '@/lib/api/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const createTmEventSchema = z.object({
	exerciseId: z.string().min(1, 'Exercise is required'),
	weekNumber: z.number()
		.int()
		.min(TM_ADJUSTMENT_CONSTANTS.MIN_WEEK, `Week must be at least ${TM_ADJUSTMENT_CONSTANTS.MIN_WEEK}`)
		.max(TM_ADJUSTMENT_CONSTANTS.MAX_WEEK, `Week cannot exceed ${TM_ADJUSTMENT_CONSTANTS.MAX_WEEK}`),
	deltaKg: z.number()
		.min(TM_ADJUSTMENT_CONSTANTS.MIN_DELTA_KG, 'Delta too negative')
		.max(TM_ADJUSTMENT_CONSTANTS.MAX_DELTA_KG, 'Delta too high'),
	preTmKg: z.number().min(1, 'Training Max must be positive'),
	postTmKg: z.number().min(1, 'New Training Max must be positive'),
	reason: z.string()
		.max(TM_ADJUSTMENT_CONSTANTS.MAX_REASON_LENGTH, `Reason too long (max ${TM_ADJUSTMENT_CONSTANTS.MAX_REASON_LENGTH} characters)`)
		.optional(),
}).refine((data) => {
	return Math.abs(data.preTmKg + data.deltaKg - data.postTmKg) < 0.01
}, {
	message: 'Delta calculation error: preTmKg + deltaKg must equal postTmKg',
	path: ['postTmKg'],
})

type CreateTmEventFormData = z.infer<typeof createTmEventSchema>

interface TmAdjustmentPanelProps {
	routineId: string
	rtfExercises: Array<{
		id: string
		exerciseId: string
		exerciseName: string
		programTMKg?: number
	}>
	programStyle?: 'STANDARD' | 'HYPERTROPHY' | null
}

export default function TmAdjustmentPanel({
	routineId,
	rtfExercises,
	programStyle,
}: TmAdjustmentPanelProps) {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [selectedExerciseId, setSelectedExerciseId] = useState<string>('')

	const { data: summary } = useGetTmAdjustmentSummary(routineId)
	const createMutation = useCreateTmAdjustment()

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		watch,
		setValue,
	} = useForm<CreateTmEventFormData>({
		resolver: zodResolver(createTmEventSchema),
		defaultValues: {
			exerciseId: '',
			weekNumber: 1,
			deltaKg: 0,
			preTmKg: 100,
			postTmKg: 100,
			reason: '',
		},
	})

	const watchedPreTm = watch('preTmKg')
	const watchedDelta = watch('deltaKg')

	// Auto-calculate postTmKg when preTmKg or deltaKg changes
	useEffect(() => {
		const newPostTm = watchedPreTm + watchedDelta
		setValue('postTmKg', newPostTm)
	}, [watchedPreTm, watchedDelta, setValue])

	const handleCreateAdjustment = async (data: CreateTmEventFormData) => {
		try {
			await createMutation.mutateAsync({
				routineId,
				data: {
					...data,
					reason: data.reason || undefined,
				},
			})
			setIsCreateDialogOpen(false)
			reset()
		} catch (error) {
			console.error('Failed to create TM adjustment:', error)
		}
	}

	const formatDelta = (delta: number) => {
		const sign = delta >= 0 ? '+' : ''
		return `${sign}${delta}kg`
	}

	if (rtfExercises.length === 0) {
		return null
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Activity className="h-5 w-5" />
						<span>Training Max Adjustments</span>
						{programStyle && (
							<Badge variant="outline" className="text-xs">
								{programStyle}
							</Badge>
						)}
					</div>
					<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
						<DialogTrigger asChild>
							<Button size="sm" variant="outline">
								<Plus className="mr-2 h-4 w-4" />
								Add Adjustment
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[500px]">
							<DialogHeader>
								<DialogTitle>Create TM Adjustment</DialogTitle>
								<DialogDescription>
									Record a Training Max adjustment for this RtF routine.
								</DialogDescription>
							</DialogHeader>
							<form onSubmit={handleSubmit(handleCreateAdjustment)} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="exerciseId">Exercise</Label>
									<Select
										value={selectedExerciseId}
										onValueChange={(value) => {
											setSelectedExerciseId(value)
											setValue('exerciseId', value)
											
											// Auto-populate current TM if available
											const exercise = rtfExercises.find(ex => ex.exerciseId === value)
											if (exercise?.programTMKg) {
												setValue('preTmKg', exercise.programTMKg)
											}
										}}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select an exercise" />
										</SelectTrigger>
										<SelectContent>
											{rtfExercises.map((ex) => (
												<SelectItem key={ex.exerciseId} value={ex.exerciseId}>
													{ex.exerciseName}
													{ex.programTMKg && (
														<span className="ml-2 text-xs text-muted-foreground">
															(Current TM: {ex.programTMKg}kg)
														</span>
													)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{errors.exerciseId && (
										<p className="text-sm text-red-500">{errors.exerciseId.message}</p>
									)}
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="weekNumber">Week</Label>
										<Input
											id="weekNumber"
											type="number"
											min={TM_ADJUSTMENT_CONSTANTS.MIN_WEEK}
											max={TM_ADJUSTMENT_CONSTANTS.MAX_WEEK}
											{...register('weekNumber', { valueAsNumber: true })}
										/>
										{errors.weekNumber && (
											<p className="text-sm text-red-500">{errors.weekNumber.message}</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="deltaKg">Adjustment (kg)</Label>
										<Input
											id="deltaKg"
											type="number"
											step="0.5"
											{...register('deltaKg', { valueAsNumber: true })}
										/>
										{errors.deltaKg && (
											<p className="text-sm text-red-500">{errors.deltaKg.message}</p>
										)}
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="preTmKg">Current TM (kg)</Label>
										<Input
											id="preTmKg"
											type="number"
											step="0.5"
											{...register('preTmKg', { valueAsNumber: true })}
										/>
										{errors.preTmKg && (
											<p className="text-sm text-red-500">{errors.preTmKg.message}</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="postTmKg">New TM (kg)</Label>
										<Input
											id="postTmKg"
											type="number"
											step="0.5"
											readOnly
											className="bg-muted"
											{...register('postTmKg', { valueAsNumber: true })}
										/>
										{errors.postTmKg && (
											<p className="text-sm text-red-500">{errors.postTmKg.message}</p>
										)}
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="reason">Reason (optional)</Label>
									<Textarea
										id="reason"
										placeholder="e.g., Completed all reps with excellent form"
										maxLength={TM_ADJUSTMENT_CONSTANTS.MAX_REASON_LENGTH}
										{...register('reason')}
									/>
									{errors.reason && (
										<p className="text-sm text-red-500">{errors.reason.message}</p>
									)}
								</div>

								<DialogFooter>
									<Button
										type="button"
										variant="outline"
										onClick={() => {
											setIsCreateDialogOpen(false)
											reset()
										}}
									>
										Cancel
									</Button>
									<Button
										type="submit"
										disabled={createMutation.isPending}
									>
										{createMutation.isPending ? 'Creating...' : 'Create Adjustment'}
									</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				</CardTitle>
				<CardDescription>
					Track Training Max changes for your RtF exercises to analyze progression.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{summary && summary.length > 0 ? (
					<div className="space-y-3">
						{summary.map((item: TmEventSummary) => (
							<div
								key={item.exerciseId}
								className="flex items-center justify-between rounded-lg border p-3"
							>
								<div>
									<p className="font-medium">{item.exerciseName}</p>
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<span>{item.adjustmentCount} adjustments</span>
										{item.lastAdjustmentDate && (
											<span>
												• Last: {new Date(item.lastAdjustmentDate).toLocaleDateString()}
											</span>
										)}
									</div>
								</div>
								<div className="flex items-center gap-2">
									<div className="text-right">
										<p className="text-sm font-medium">
											{formatDelta(item.totalDeltaKg)}
										</p>
										<p className="text-xs text-muted-foreground">
											Avg: {formatDelta(item.averageDeltaKg)}
										</p>
									</div>
									{item.totalDeltaKg > 0 ? (
										<TrendingUp className="h-4 w-4 text-green-500" />
									) : item.totalDeltaKg < 0 ? (
										<TrendingDown className="h-4 w-4 text-red-500" />
									) : (
										<Activity className="h-4 w-4 text-muted-foreground" />
									)}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="py-6 text-center text-muted-foreground">
						<Activity className="mx-auto mb-2 h-8 w-8 opacity-50" />
						<p>No TM adjustments recorded yet.</p>
						<p className="text-sm">Create your first adjustment to start tracking progress.</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}