'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { WeekdayConsistencyHint } from './components/WeekdayConsistencyHint'
import { RtfProgramPreviewPanel } from './components/RtfProgramPreviewPanel'
import { DAYS_OF_WEEK } from './constants/training-days'
import { useRtfProgramPreview } from './hooks/useRtfProgramPreview'
import type { RoutineWizardData } from './types'
import { notifyInfo } from './utils/notifications'

interface RtfConfigurationProps {
	readonly data: RoutineWizardData
	readonly onUpdate: (updates: Partial<RoutineWizardData>) => void
}

export function RtfConfiguration({ data, onUpdate }: RtfConfigurationProps) {
	const { preview, fullProgram, tmTrend, rtfExercises, previewExerciseId, setPreviewExerciseId } =
		useRtfProgramPreview({ data, onUpdate })

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="space-y-2">
				<h2 className="text-2xl font-bold">RtF Program Configuration</h2>
				<p className="text-muted-foreground">
					Your routine includes Reps to Failure (RtF) exercises. Configure your program settings and preview the progression timeline.
				</p>
			</div>

			{/* RtF Program Settings */}
			<div className="bg-muted/30 p-4 md:p-6 rounded-lg space-y-4">
				<h3 className="font-semibold text-lg">Program Settings</h3>
				
				<div className="space-y-4">
					{/* Deload Weeks Toggle */}
					<div className="flex items-center justify-between gap-3 p-3 bg-background rounded-md">
						<div className="space-y-1">
							<span className="text-sm font-medium">Include deload weeks</span>
							<p className="text-xs text-muted-foreground">
								{data.programWithDeloads 
									? '21-week program with deload weeks at W7, W14, W21'
									: '18-week program without deload weeks'}
							</p>
						</div>
						<Checkbox
							aria-label="Include deload weeks"
							checked={!!data.programWithDeloads}
							onCheckedChange={(checked: boolean) => {
								const nextWithDeloads = Boolean(checked)
								const nextTotal = nextWithDeloads ? 21 : 18
								const currentStart = data.programStartWeek ?? 1
								let clampedStart = Math.min(currentStart, nextTotal)
								if (!nextWithDeloads && currentStart > 18) {
									notifyInfo(
										'"Deload weeks removed: start week adjusted to 18 (max for no-deload program)."',
									)
									clampedStart = 18
								}
								onUpdate({
									programWithDeloads: nextWithDeloads,
									programStartWeek: clampedStart,
								})
							}}
						/>
					</div>

					{/* Weekday Consistency Hint */}
					<WeekdayConsistencyHint
						programStartDate={data.programStartDate}
						trainingDays={data.trainingDays}
						dayInfos={DAYS_OF_WEEK}
					/>
				</div>
			</div>

			{/* Program Preview Panel */}
			<div className="bg-muted/30 p-4 md:p-6 rounded-lg space-y-4">
				<h3 className="font-semibold text-lg">Program Preview</h3>
				<p className="text-sm text-muted-foreground">
					View the progression timeline for your RtF exercises across the program duration.
				</p>
				<RtfProgramPreviewPanel
					preview={preview}
					fullProgram={fullProgram}
					tmTrend={tmTrend}
					rtfExercises={rtfExercises}
					previewExerciseId={previewExerciseId}
					onPreviewExerciseChange={setPreviewExerciseId}
					programWithDeloads={data.programWithDeloads}
				/>
			</div>
		</div>
	)
}
