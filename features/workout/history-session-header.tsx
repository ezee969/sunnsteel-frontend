'use client'

import { ArrowLeft, Clock, Target, Weight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { SessionMetrics } from '@/lib/utils/workout-metrics'

interface HistorySessionHeaderProps {
	title?: string
	metrics: SessionMetrics
	onBack: () => void
}

export function HistorySessionHeader({
	title = 'Workout Session',
	metrics,
	onBack,
}: HistorySessionHeaderProps) {
	return (
		<div className="mb-6">
			<div className="flex items-center gap-3 mb-4">
				<Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h1 className="text-2xl font-bold">{title}</h1>
					<p className="text-muted-foreground">
						{metrics.dayLabel} • {metrics.dateLabel}
					</p>
				</div>
			</div>

			<Card>
				<CardContent className="p-4">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
						<div className="flex items-center gap-2">
							<Badge
								variant={
									metrics.statusLabel === 'COMPLETED'
										? 'default'
										: metrics.statusLabel === 'IN_PROGRESS'
											? 'secondary'
											: 'destructive'
								}
							>
								{metrics.statusLabel}
							</Badge>
						</div>
						<div className="flex items-center gap-2">
							<Clock className="h-4 w-4 text-muted-foreground" />
							<span>{metrics.durationLabel}</span>
						</div>
						<div className="flex items-center gap-2">
							<Target className="h-4 w-4 text-muted-foreground" />
							<span>{metrics.completedSets} sets</span>
						</div>
						<div className="flex items-center gap-2">
							<Weight className="h-4 w-4 text-muted-foreground" />
							<span>{metrics.totalVolumeLabel}</span>
						</div>
					</div>

					{metrics.notes && (
						<div className="mt-4 pt-4 border-t">
							<p className="text-sm text-muted-foreground">{metrics.notes}</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
