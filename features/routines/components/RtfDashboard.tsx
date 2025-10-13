/**
 * RTF Dashboard Component
 * Comprehensive RTF program overview combining timeline, forecast, and current goals
 * Integrates RTF-F02 (Timeline), RTF-F05 (Forecast), and RTF-F01 (Week Goals)
 */

'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  Dumbbell,
  AlertCircle,
  BarChart3,
  Zap
} from 'lucide-react'
import { useRtFWeekGoals, useRtFTimeline, useRtFForecast } from '@/lib/api/hooks'
import { RtfTimeline } from './RtfTimeline'
import { RtfForecastCard } from './RtfForecastCard'
import { AmrapPerformancePanel } from './AmrapPerformancePanel'
import { WeeklyTrendCharts } from './WeeklyTrendCharts'
import { AnomalyNotificationSurface } from './AnomalyNotificationSurface'
import { ProgramHistoryModal } from './ProgramHistoryModal'
import { calculateTimelineStats } from '@/lib/utils/rtf-timeline-adapter'
import type { RtfExerciseGoal } from '@/lib/api/types'

interface RtfDashboardProps {
  routineId: string
  className?: string
  defaultTab?: 'overview' | 'timeline' | 'forecast' | 'amrap' | 'trends' | 'insights'
}

interface WeekGoalsOverviewProps {
  routineId: string
  currentWeek?: number
}

function ExerciseGoalCard({ goal }: { goal: RtfExerciseGoal }) {
  const { exerciseName, variant, intensity, fixedReps, setsPlanned, isDeload, amrapTarget } = goal
  
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-sm">{exerciseName}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={variant === 'HYPERTROPHY' ? 'secondary' : 'outline'} className="text-xs">
              {variant}
            </Badge>
            {isDeload && (
              <Badge variant="destructive" className="text-xs">
                Deload
              </Badge>
            )}
          </div>
        </div>
        
        <div className="text-right text-sm">
          <div className="font-semibold">{Math.round(intensity * 100)}%</div>
          <div className="text-muted-foreground">Intensity</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="font-medium">{fixedReps} reps</div>
          <div className="text-muted-foreground">Base Sets</div>
        </div>
        <div>
          <div className="font-medium">{setsPlanned} sets</div>
          <div className="text-muted-foreground">Total</div>
        </div>
      </div>
      
      {amrapTarget && !isDeload && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">AMRAP Target:</span>
            <span className="font-medium text-primary">{amrapTarget}+ reps</span>
          </div>
        </div>
      )}
    </Card>
  )
}

function WeekGoalsOverview({ routineId, currentWeek }: WeekGoalsOverviewProps) {
  const { data: routine, isLoading, error } = useRtFWeekGoals(routineId, currentWeek)
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }
  
  if (error || !routine?.rtfGoals) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p>Unable to load week goals</p>
            <p className="text-sm mt-1">
              {error?.message || 'No RTF goals available for this week'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  const { rtfGoals } = routine
  const { goals, week, withDeloads } = rtfGoals
  
  if (!goals.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No goals for week {week}</p>
            <p className="text-sm mt-1">
              This week may not have RTF exercises
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  const deloadGoals = goals.filter(goal => goal.isDeload)
  const trainingGoals = goals.filter(goal => !goal.isDeload)
  
  return (
    <div className="space-y-6">
      {/* Week summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Week {week} Goals</h3>
          <p className="text-sm text-muted-foreground">
            {goals.length} exercise{goals.length !== 1 ? 's' : ''} programmed
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {deloadGoals.length > 0 && (
            <Badge variant="destructive">Deload Week</Badge>
          )}
          {withDeloads && (
            <Badge variant="outline">Program includes deloads</Badge>
          )}
        </div>
      </div>
      
      {/* Exercise goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map(goal => (
          <ExerciseGoalCard key={goal.routineExerciseId} goal={goal} />
        ))}
      </div>
      
      {/* Summary stats */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{trainingGoals.length}</div>
              <div className="text-sm text-muted-foreground">Training</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-500">{deloadGoals.length}</div>
              <div className="text-sm text-muted-foreground">Deload</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {Math.round(goals.reduce((sum, g) => sum + g.intensity, 0) / goals.length * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Intensity</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {goals.reduce((sum, g) => sum + g.setsPlanned, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Sets</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ForecastTab({ routineId, currentWeek }: { routineId: string; currentWeek?: number }) {
  const { data: forecast, isLoading, error } = useRtFForecast(routineId, currentWeek ? { targetWeeks: [currentWeek] } : undefined)
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  
  if (error || !forecast) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p>Unable to load forecast data</p>
            <p className="text-sm mt-1">
              {error?.message || 'Forecast not available'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return <RtfForecastCard forecast={forecast} targetWeek={currentWeek} />
}

export function RtfDashboard({ routineId, className, defaultTab = 'overview' }: RtfDashboardProps) {
  const { data: timeline } = useRtFTimeline(routineId)
  
  // Calculate current week from timeline if available
  const currentWeek = useMemo(() => {
    if (!timeline?.timeline.length) return 1
    
    // For now, assume week 1. In production, this would be calculated
    // based on the routine's start date and current date
    return 1
  }, [timeline])
  
  const timelineStats = useMemo(() => {
    if (!timeline) return null
    return calculateTimelineStats(timeline, currentWeek)
  }, [timeline, currentWeek])
  
  return (
    <div className={className}>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Forecast
          </TabsTrigger>
          <TabsTrigger value="amrap" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            AMRAP
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Quick stats */}
          {timelineStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{timelineStats.currentWeek}</div>
                <div className="text-sm text-muted-foreground">Current Week</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold">{timelineStats.progress}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold">{timelineStats.remainingWeeks}</div>
                <div className="text-sm text-muted-foreground">Remaining</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-500">{timelineStats.deloadWeeks}</div>
                <div className="text-sm text-muted-foreground">Deloads</div>
              </Card>
            </div>
          )}
          
          {/* Current week goals */}
          <WeekGoalsOverview routineId={routineId} currentWeek={currentWeek} />
        </TabsContent>
        
        <TabsContent value="timeline" className="mt-6">
          <RtfTimeline routineId={routineId} currentWeek={currentWeek} />
        </TabsContent>
        
        <TabsContent value="forecast" className="mt-6">
          <ForecastTab routineId={routineId} currentWeek={currentWeek} />
        </TabsContent>
        
        <TabsContent value="amrap" className="mt-6">
          <AmrapPerformancePanel 
            routineId={routineId} 
            currentWeek={currentWeek}
          />
        </TabsContent>
        
        <TabsContent value="trends" className="mt-6">
          <WeeklyTrendCharts 
            routineId={routineId}
            showPredictions={true}
          />
        </TabsContent>
        
        <TabsContent value="insights" className="mt-6">
          <div className="space-y-6">
            <AnomalyNotificationSurface 
              routineId={routineId}
              currentWeek={currentWeek}
            />
            
            <div className="flex justify-center">
              <ProgramHistoryModal 
                routineId={routineId}
                routineName="RTF Program"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}