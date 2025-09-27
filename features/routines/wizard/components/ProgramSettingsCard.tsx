'use client'

import { RoutineWizardData } from '../types'
import { formatDateForDisplay } from '../utils/date'
import { getProgramWeekInfo } from '../utils/routine-summary'

interface ProgramSettingsCardProps {
	data: RoutineWizardData
	usesRtf: boolean
	isEditing: boolean
}

/**
 * Render a card displaying Run the F* program settings when RtF is enabled.
 *
 * Shows whether deload weeks are included, the formatted start date, total program weeks,
 * and — when not editing — the current start program week (e.g., "Week 1 of 12").
 *
 * @param data - Routine wizard data used to compute and display program dates and week info
 * @param isEditing - When true, omits the "Start Program Week" field from the rendered card
 * @returns The card element with program settings when RtF is enabled, or `null` when it is not
 */
export function ProgramSettingsCard({ data, usesRtf, isEditing }: ProgramSettingsCardProps) {
	if (!usesRtf) {
		return null
	}

	const { totalWeeks, startWeek } = getProgramWeekInfo(data)

	return (
		<div className="rounded-lg border bg-card text-card-foreground p-4">
			<h3 className="text-base font-semibold leading-none tracking-tight mb-3">
				Program Settings (RtF)
			</h3>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
				<div>
					<p className="text-muted-foreground">Include deload weeks</p>
					<p className="font-medium">{data.programWithDeloads ? 'Yes' : 'No'}</p>
				</div>
				<div>
					<p className="text-muted-foreground">Start date</p>
					<p className="font-medium">{formatDateForDisplay(data.programStartDate)}</p>
				</div>
				{!isEditing && (
					<div>
						<p className="text-muted-foreground">Start Program Week</p>
						<p className="font-medium">
							Week {startWeek} of {totalWeeks}
						</p>
					</div>
				)}
				<div>
					<p className="text-muted-foreground">Total weeks</p>
					<p className="font-medium">{totalWeeks}</p>
				</div>
			</div>
		</div>
	)
}
