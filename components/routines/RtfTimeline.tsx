/**
 * RTF Timeline Component
 * RTF-F02: Timeline view UI - Visual representation of RTF program weeks
 * Displays weeks, deload periods, and current progress
 */

'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarDays, TrendingUp, Dumbbell } from 'lucide-react'
import { useRtFTimeline } from '@/lib/api/hooks'
import { cn } from '@/lib/utils'
import type { RtfTimelineEntry } from '@/lib/api/types'

interface RtfTimelineProps {
  routineId: string
  currentWeek?: number
  className?: string
  compact?: boolean
}

interface TimelineWeekProps {
  entry: RtfTimelineEntry
  isCurrentWeek: boolean
  isPastWeek: boolean
  compact?: boolean
}

function TimelineWeek({ entry, isCurrentWeek, isPastWeek, compact = false }: TimelineWeekProps) {
  const { week, isDeload, startDate } = entry
  
  const weekDate = new Date(startDate)
  const dateStr = weekDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-2 p-2 rounded-lg border transition-colors',
        {
          // Current week styling
          'bg-primary/10 border-primary shadow-sm': isCurrentWeek,
          // Past weeks
          'bg-muted/50 border-muted': isPastWeek && !isCurrentWeek,
          // Future weeks  
          'border-border hover:bg-muted/30': !isPastWeek && !isCurrentWeek,
          // Deload weeks
          'ring-2 ring-orange-200 bg-orange-50': isDeload && !isCurrentWeek,
          'ring-2 ring-orange-300 bg-orange-100': isDeload && isCurrentWeek,
          // Compact mode
          'p-1 gap-1': compact
        }
      )}
    >
      {/* Week number */}
      <div className={cn(
        'flex items-center justify-center rounded-full font-semibold',
        compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm',
        {
          'bg-primary text-primary-foreground': isCurrentWeek,
          'bg-muted text-muted-foreground': isPastWeek && !isCurrentWeek,
          'bg-background text-foreground': !isPastWeek && !isCurrentWeek
        }
      )}>
        {week}
      </div>

      {/* Week type badge */}
      {isDeload && (
        <Badge 
          variant={isCurrentWeek ? 'default' : 'secondary'} 
          className={cn('text-xs', compact && 'px-1 py-0')}
        >
          Deload
        </Badge>
      )}

      {/* Date (non-compact only) */}
      {!compact && (
        <span className="text-xs text-muted-foreground text-center">
          {dateStr}
        </span>
      )}

      {/* Current week indicator */}
      {isCurrentWeek && (
        <div className="absolute -top-1 -right-1">
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
        </div>
      )}
    </div>
  )
}

export function RtfTimeline({ routineId, currentWeek, className, compact = false }: RtfTimelineProps) {
  const { data: timeline, isLoading, error } = useRtFTimeline(routineId)

  const timelineStats = useMemo(() => {
    if (!timeline) return null

    const totalWeeks = timeline.totalWeeks
    const deloadWeeks = timeline.timeline.filter(entry => entry.isDeload).length
    const trainingWeeks = totalWeeks - deloadWeeks
    const currentWeekNum = currentWeek || 1

    return {
      totalWeeks,
      deloadWeeks, 
      trainingWeeks,
      currentWeekNum,
      progress: Math.round((currentWeekNum / totalWeeks) * 100)
    }
  }, [timeline, currentWeek])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-12 gap-2">
            {Array.from({ length: 18 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Unable to load timeline</p>
            <p className="text-sm mt-1">
              {error.message || 'Please try again later'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!timeline || !timeline.timeline.length) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No timeline available</p>
            <p className="text-sm mt-1">
                          <p>This routine doesn&apos;t have RTF programming data</p>
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className={cn('pb-3', compact && 'pb-2')}>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4" />
          RTF Program Timeline
          {timelineStats && (
            <Badge variant="outline" className="ml-auto">
              Week {timelineStats.currentWeekNum} of {timelineStats.totalWeeks}
            </Badge>
          )}
        </CardTitle>
        
        {/* Progress stats */}
        {timelineStats && !compact && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {timelineStats.progress}% Complete
            </div>
            <div className="flex items-center gap-1">
              <Dumbbell className="h-3 w-3" />
              {timelineStats.trainingWeeks} Training
            </div>
            {timelineStats.deloadWeeks > 0 && (
              <div className="text-orange-600">
                {timelineStats.deloadWeeks} Deload
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className={cn(
          'grid gap-2',
          compact 
            ? 'grid-cols-6 sm:grid-cols-9 lg:grid-cols-12' 
            : 'grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 xl:grid-cols-12'
        )}>
          {timeline.timeline.map((entry) => {
            const isCurrentWeek = timelineStats?.currentWeekNum === entry.week
            const isPastWeek = (timelineStats?.currentWeekNum || 1) > entry.week
            
            return (
              <TimelineWeek
                key={entry.week}
                entry={entry}
                isCurrentWeek={isCurrentWeek}
                isPastWeek={isPastWeek}
                compact={compact}
              />
            )
          })}
        </div>

        {/* Deload legend */}
        {timeline.withDeloads && !compact && (
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              Training Week
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-400" />
              Deload Week
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}