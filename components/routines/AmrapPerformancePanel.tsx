/**
 * AMRAP Performance Panel Component
 * RTF-F06: AMRAP performance panel - Workout analytics for AMRAP sets
 * Shows AMRAP performance trends, targets vs actual, and performance insights
 */

'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Zap,
  AlertCircle
} from 'lucide-react'
import { useRtFWeekGoals } from '@/lib/api/hooks'
import { cn } from '@/lib/utils'
import type { RtfExerciseGoal } from '@/lib/api/types'

interface AmrapPerformancePanelProps {
  routineId: string
  currentWeek?: number
  className?: string
  compact?: boolean
}

interface AmrapPerformance {
  exerciseId: string
  exerciseName: string
  target: number
  actual?: number
  performance: 'excellent' | 'good' | 'target' | 'below' | 'pending'
  trend: 'up' | 'down' | 'stable' | 'unknown'
  confidence: 'high' | 'medium' | 'low'
}

interface ExerciseAmrapCardProps {
  performance: AmrapPerformance
  compact?: boolean
}

function getPerformanceColor(performance: AmrapPerformance['performance']): string {
  switch (performance) {
    case 'excellent': return 'text-green-600'
    case 'good': return 'text-blue-600'
    case 'target': return 'text-primary'
    case 'below': return 'text-orange-600'
    case 'pending': return 'text-muted-foreground'
    default: return 'text-muted-foreground'
  }
}

function getPerformanceLabel(performance: AmrapPerformance['performance']): string {
  switch (performance) {
    case 'excellent': return 'Excellent (+3 above target)'
    case 'good': return 'Good (+1-2 above target)'
    case 'target': return 'Hit Target'
    case 'below': return 'Below Target'
    case 'pending': return 'Not yet performed'
    default: return 'Unknown'
  }
}

function getTrendIcon(trend: AmrapPerformance['trend']) {
  switch (trend) {
    case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />
    case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />
    case 'stable': return <div className="w-3 h-0.5 bg-muted-foreground" />
    case 'unknown': return <div className="w-3 h-3 rounded-full bg-muted-foreground opacity-30" />
    default: return null
  }
}

function ExerciseAmrapCard({ performance, compact = false }: ExerciseAmrapCardProps) {
  const { exerciseName, target, actual, performance: perf, trend, confidence } = performance
  
  const performanceDiff = actual !== undefined ? actual - target : 0
  const performanceColor = getPerformanceColor(perf)
  
  return (
    <Card className={cn('transition-colors hover:bg-muted/30', compact && 'p-2')}>
      <CardContent className={cn('p-4', compact && 'p-3')}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className={cn('font-medium truncate', compact ? 'text-sm' : 'text-base')}>
              {exerciseName}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                AMRAP Target: {target}+
              </Badge>
              {getTrendIcon(trend)}
            </div>
          </div>
          
          <div className="text-right">
            {actual !== undefined ? (
              <div>
                <div className={cn('text-lg font-bold', performanceColor)}>
                  {actual}
                </div>
                <div className="text-xs text-muted-foreground">
                  {performanceDiff > 0 && '+'}{performanceDiff}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">
                <div className="text-lg font-bold">--</div>
                <div className="text-xs">Pending</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className={cn('text-sm', performanceColor)}>
            {getPerformanceLabel(perf)}
          </span>
          
          <div className="flex items-center gap-1">
            <div className={cn(
              'w-2 h-2 rounded-full',
              confidence === 'high' ? 'bg-green-500' : 
              confidence === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
            )} />
            <span className="text-xs text-muted-foreground">
              {confidence}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function mockAmrapPerformanceData(goals: RtfExerciseGoal[]): AmrapPerformance[] {
  // In production, this would fetch actual workout data
  // For now, generate mock performance data based on goals
  return goals
    .filter(goal => goal.amrapTarget !== null && !goal.isDeload)
    .map(goal => {
      const target = goal.amrapTarget!
      // Mock some actual performance data
      const hasActual = Math.random() > 0.3 // 70% have actual data
      const actual = hasActual ? target + Math.floor(Math.random() * 5) - 1 : undefined
      
      let performance: AmrapPerformance['performance'] = 'pending'
      if (actual !== undefined) {
        const diff = actual - target
        if (diff >= 3) performance = 'excellent'
        else if (diff >= 1) performance = 'good'
        else if (diff === 0) performance = 'target'
        else performance = 'below'
      }
      
      return {
        exerciseId: goal.exerciseId,
        exerciseName: goal.exerciseName,
        target,
        actual,
        performance,
        trend: ['up', 'down', 'stable', 'unknown'][Math.floor(Math.random() * 4)] as AmrapPerformance['trend'],
        confidence: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as AmrapPerformance['confidence']
      }
    })
}

export function AmrapPerformancePanel({ 
  routineId, 
  currentWeek, 
  className, 
  compact = false 
}: AmrapPerformancePanelProps) {
  const { data: routine, isLoading, error } = useRtFWeekGoals(routineId, currentWeek)
  
  const amrapData = useMemo(() => {
    if (!routine?.rtfGoals?.goals) return []
    return mockAmrapPerformanceData(routine.rtfGoals.goals)
  }, [routine?.rtfGoals?.goals])
  
  const stats = useMemo(() => {
    if (!amrapData.length) return null
    
    const completed = amrapData.filter(d => d.actual !== undefined)
    const pending = amrapData.length - completed.length
    const excellent = completed.filter(d => d.performance === 'excellent').length
    const aboveTarget = completed.filter(d => d.performance === 'excellent' || d.performance === 'good').length
    const averagePerformance = completed.length > 0 
      ? completed.reduce((sum, d) => sum + (d.actual! - d.target), 0) / completed.length
      : 0
    
    return {
      total: amrapData.length,
      completed: completed.length,
      pending,
      excellent,
      aboveTarget,
      averagePerformance: Math.round(averagePerformance * 10) / 10,
      completionRate: Math.round((completed.length / amrapData.length) * 100)
    }
  }, [amrapData])
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <Skeleton className="h-5 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (error || !routine?.rtfGoals) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p>Unable to load AMRAP performance</p>
            <p className="text-sm mt-1">
              {error?.message || 'No RTF goals available'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (!amrapData.length) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No AMRAP sets this week</p>
            <p className="text-sm mt-1">
              This week focuses on fixed rep training
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4" />
          AMRAP Performance
          {stats && (
            <Badge variant="outline" className="ml-auto">
              Week {routine.rtfGoals.week}
            </Badge>
          )}
        </CardTitle>
        
        {/* Performance stats */}
        {stats && !compact && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{stats.completionRate}%</div>
              <div className="text-muted-foreground">Complete</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats.excellent}</div>
              <div className="text-muted-foreground">Excellent</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{stats.aboveTarget}</div>
              <div className="text-muted-foreground">Above Target</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">+{stats.averagePerformance}</div>
              <div className="text-muted-foreground">Avg Reps</div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className={cn(
          'grid gap-4',
          compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
        )}>
          {amrapData.map(performance => (
            <ExerciseAmrapCard
              key={performance.exerciseId}
              performance={performance}
              compact={compact}
            />
          ))}
        </div>
        
        {!compact && stats && stats.pending > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>
                {stats.pending} AMRAP set{stats.pending !== 1 ? 's' : ''} pending completion
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}