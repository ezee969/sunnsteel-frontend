'use client'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import {
	Select as UiSelect,
	SelectContent as UiSelectContent,
	SelectItem as UiSelectItem,
	SelectTrigger as UiSelectTrigger,
	SelectValue as UiSelectValue,
} from '@/components/ui/select'
import type { TmTrendSnapshot } from '@/lib/analytics/tm-trend'
import type { RoutineWizardExercise } from '../types'

interface PreviewRow {
	readonly week: number
	readonly goal: string
	readonly weight: number
}

interface RtfProgramPreviewPanelProps {
	readonly preview: PreviewRow[]
	readonly fullProgram: Array<{
		week: number
		goal: string
		weight: number
		action: string
	}>
	readonly tmTrend: TmTrendSnapshot | null
	readonly rtfExercises: RoutineWizardExercise[]
	readonly previewExerciseId: string | undefined
	readonly onPreviewExerciseChange: (exerciseId: string) => void
	readonly programWithDeloads: boolean | undefined
}

export const RtfProgramPreviewPanel = ({
	preview,
	fullProgram,
	tmTrend,
	rtfExercises,
	previewExerciseId,
	onPreviewExerciseChange,
	programWithDeloads,
}: RtfProgramPreviewPanelProps) => {
	if (preview.length === 0) {
		return null
	}

	const totalWeeksLabel = programWithDeloads ? '21 weeks total' : '18 weeks total'
	const hasTmAdjustments = Boolean(tmTrend?.adjustments?.length)

	return (
		<div className="mt-2 border rounded-md bg-background overflow-hidden">
			<div className="px-2 py-1.5 text-xs font-medium bg-muted/60 flex items-center justify-between">
				<span className="flex items-center gap-2">
					Program Preview (first 6 weeks)
					{rtfExercises.length > 1 && (
						<UiSelect
							value={previewExerciseId}
							onValueChange={onPreviewExerciseChange}
						>
							<UiSelectTrigger className="h-6 w-40 text-xs">
								<UiSelectValue placeholder="Exercise" />
							</UiSelectTrigger>
							<UiSelectContent>
								{rtfExercises.map((exercise) => (
									<UiSelectItem
										key={exercise.exerciseId}
										value={exercise.exerciseId}
									>
										{exercise.exerciseId}
									</UiSelectItem>
								))}
							</UiSelectContent>
						</UiSelect>
					)}
				</span>
				<span className="text-muted-foreground flex items-center gap-2">
					{totalWeeksLabel}
					<Dialog>
						<DialogTrigger asChild>
							<Button variant="outline" size="sm" className="h-6 px-2 text-[11px]">
								View full program
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-3xl">
							<DialogHeader>
								<DialogTitle>Full Program</DialogTitle>
							</DialogHeader>
							<div className="max-h-[60vh] overflow-auto border rounded-md">
								<table className="w-full text-xs">
									<thead className="sticky top-0 bg-background">
										<tr className="border-b">
											<th className="px-2 py-1 text-left">Week</th>
											<th className="px-2 py-1 text-left">Goal</th>
											<th className="px-2 py-1 text-left">Top Set Load</th>
											<th className="px-2 py-1 text-left">Action</th>
										</tr>
									</thead>
									<tbody>
										{fullProgram.map((row) => (
											<tr key={row.week} className="border-b last:border-b-0">
												<td className="px-2 py-1">{row.week}</td>
												<td
													className="px-2 py-1 whitespace-nowrap max-w-[180px] truncate"
													title={row.goal}
												>
													{row.goal}
												</td>
												<td className="px-2 py-1">{row.weight}kg</td>
												<td
													className="px-2 py-1 whitespace-nowrap max-w-[220px] truncate"
													title={row.action}
												>
													{row.action}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							{hasTmAdjustments ? (
								<div className="mt-3 text-xs space-y-1">
									<p className="font-medium">TM Adjustments</p>
									<ul className="list-disc ml-4 space-y-0.5">
										{tmTrend?.adjustments?.map((adjustment) => (
											<li key={adjustment.week}>
												W{adjustment.week}:{' '}
												{adjustment.previousTm.toFixed(1)} →{' '}
												{adjustment.newTm.toFixed(1)}kg ({adjustment.percentChange >= 0 ? '+' : ''}
												{adjustment.percentChange.toFixed(1)}%)
											</li>
										))}
									</ul>
								</div>
							) : null}
						</DialogContent>
					</Dialog>
				</span>
			</div>
			<table className="w-full text-xs">
				<thead>
					<tr className="text-left border-b">
						<th className="px-2 py-1 font-medium">Week</th>
						<th className="px-2 py-1 font-medium">Goal</th>
						<th className="px-2 py-1 font-medium">Top Set Load</th>
					</tr>
				</thead>
				<tbody>
					{preview.map((row) => (
						<tr key={row.week} className="border-b last:border-b-0">
							<td className="px-2 py-1">{row.week}</td>
							<td
								className="px-2 py-1 whitespace-nowrap max-w-[140px] truncate"
								title={row.goal}
							>
								{row.goal}
							</td>
							<td className="px-2 py-1">{row.weight}kg</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
