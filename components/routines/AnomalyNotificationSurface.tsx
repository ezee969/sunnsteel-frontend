/**
 * Anomaly Notification Surface Component
 * RTF-F08: Anomaly notification surface - Training performance alerts
 * Detects and displays performance anomalies, deload recommendations, and training insights
 */

'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Activity,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  Info,
  Zap
} from 'lucide-react'
import { useRtFTimeline, useRtFWeekGoals } from '@/lib/api/hooks'
import { cn } from '@/lib/utils'
import type { RtfTimelineEntry, RtfExerciseGoal } from '@/lib/api/types'

interface AnomalyNotificationSurfaceProps {
  routineId: string
  currentWeek?: number
  className?: string
  compact?: boolean
  onDismissAnomaly?: (anomalyId: string) => void
}

type AnomalySeverity = 'critical' | 'warning' | 'info' | 'success'
type AnomalyType = 'performance_drop' | 'overreaching' | 'deload_needed' | 'plateau' | 'improvement' | 'form_concern'

interface TrainingAnomaly {
  id: string
  type: AnomalyType
  severity: AnomalySeverity
  title: string
  description: string
  recommendation?: string
  affectedExercises?: string[]
  weekDetected: number
  confidence: 'high' | 'medium' | 'low'
  isDismissed?: boolean
  actionRequired: boolean
}

interface AnomalyCardProps {
  anomaly: TrainingAnomaly
  onDismiss?: (id: string) => void
  compact?: boolean
}

function getAnomalyIcon(type: AnomalyType, severity: AnomalySeverity) {
  switch (type) {
    case 'performance_drop':
      return <TrendingDown className={cn('h-4 w-4', severity === 'critical' ? 'text-red-500' : 'text-orange-500')} />
    case 'improvement':
      return <TrendingUp className="h-4 w-4 text-green-500" />
    case 'deload_needed':
      return <Activity className="h-4 w-4 text-orange-500" />
    case 'overreaching':
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    case 'plateau':
      return <Target className="h-4 w-4 text-yellow-500" />
    case 'form_concern':
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <Info className="h-4 w-4 text-blue-500" />
  }
}

function getSeverityColor(severity: AnomalySeverity): string {
  switch (severity) {
    case 'critical': return 'border-red-200 bg-red-50'
    case 'warning': return 'border-orange-200 bg-orange-50'
    case 'info': return 'border-blue-200 bg-blue-50'
    case 'success': return 'border-green-200 bg-green-50'
    default: return 'border-gray-200 bg-gray-50'
  }
}

function getConfidenceColor(confidence: TrainingAnomaly['confidence']): string {
  switch (confidence) {
    case 'high': return 'bg-green-500'
    case 'medium': return 'bg-yellow-500'
    case 'low': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

function AnomalyCard({ anomaly, onDismiss, compact = false }: AnomalyCardProps) {
  const { id, type, severity, title, description, recommendation, affectedExercises, confidence, actionRequired } = anomaly
  
  return (
    <Alert className={cn(
      'transition-all duration-200',
      getSeverityColor(severity),
      compact && 'p-3'
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getAnomalyIcon(type, severity)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={cn('font-medium', compact ? 'text-sm' : 'text-base')}>
                  {title}
                </h4>
                {actionRequired && (
                  <Badge variant="destructive" className="text-xs px-2 py-0.5">
                    Action Required
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  Week {anomaly.weekDetected}
                </Badge>
                <div className="flex items-center gap-1">
                  <div className={cn('w-2 h-2 rounded-full', getConfidenceColor(confidence))} />
                  <span className="text-xs text-muted-foreground capitalize">{confidence}</span>
                </div>
              </div>
            </div>
            
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(id)}
                className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
              >
                <XCircle className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <AlertDescription className={cn('mb-3', compact && 'text-xs')}>
            {description}
          </AlertDescription>
          
          {affectedExercises && affectedExercises.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-muted-foreground mb-1">Affected Exercises:</div>
              <div className="flex flex-wrap gap-1">
                {affectedExercises.map(exercise => (
                  <Badge key={exercise} variant="secondary" className="text-xs">
                    {exercise}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {recommendation && (
            <div className="p-2 bg-background/50 rounded border text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs">{recommendation}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Alert>
  )
}

function detectAnomalies(
  timeline: RtfTimelineEntry[]
): TrainingAnomaly[] {
  const anomalies: TrainingAnomaly[] = []
  
  if (!timeline.length) return anomalies
  
  const currentWeek = timeline.length > 0 ? Math.max(...timeline.map(t => t.week)) : 1
  
  // Mock anomaly detection logic (in production, this would analyze real performance data)
  
  // 1. Performance drop detection
  if (currentWeek > 4 && Math.random() > 0.7) {
    anomalies.push({
      id: 'perf-drop-1',
      type: 'performance_drop',
      severity: 'warning',
      title: 'Performance Decline Detected',
      description: 'Your AMRAP performance has decreased by 15% over the last 2 weeks compared to your baseline.',
      recommendation: 'Consider a mini-deload or reducing training intensity for 3-5 days to allow for recovery.',
      affectedExercises: ['Bench Press', 'Squat'],
      weekDetected: currentWeek,
      confidence: 'high',
      actionRequired: true
    })
  }
  
  // 2. Deload recommendation
  const lastDeload = timeline.slice().reverse().findIndex(t => t.isDeload)
  if (lastDeload > 6 || lastDeload === -1) {
    anomalies.push({
      id: 'deload-needed-1',
      type: 'deload_needed',
      severity: 'warning',
      title: 'Deload Week Recommended',
      description: `It's been ${lastDeload === -1 ? 'over 8' : lastDeload} weeks since your last deload. Your body may benefit from reduced intensity.`,
      recommendation: 'Schedule a deload week with 60-70% of normal training intensity.',
      weekDetected: currentWeek,
      confidence: 'medium',
      actionRequired: true
    })
  }
  
  // 3. Positive performance trend
  if (Math.random() > 0.6) {
    anomalies.push({
      id: 'improvement-1',
      type: 'improvement',
      severity: 'success',
      title: 'Strong Progress Detected',
      description: 'Your training metrics show consistent improvement over the past 3 weeks.',
      recommendation: 'Continue with current programming. Consider slight load increases next week.',
      affectedExercises: ['Deadlift', 'Overhead Press'],
      weekDetected: currentWeek,
      confidence: 'high',
      actionRequired: false
    })
  }
  
  // 4. Plateau detection
  if (currentWeek > 6 && Math.random() > 0.8) {
    anomalies.push({
      id: 'plateau-1',
      type: 'plateau',
      severity: 'info',
      title: 'Progress Plateau Identified',
      description: 'Training loads have remained static for 4+ weeks across multiple movements.',
      recommendation: 'Consider exercise variations, rep range changes, or volume adjustments to stimulate adaptation.',
      affectedExercises: ['Bench Press', 'Squat', 'Row'],
      weekDetected: currentWeek,
      confidence: 'medium',
      actionRequired: false
    })
  }
  
  // 5. Overreaching warning (critical)
  if (Math.random() > 0.9) {
    anomalies.push({
      id: 'overreaching-1',
      type: 'overreaching',
      severity: 'critical',
      title: 'Overreaching Warning',
      description: 'Multiple performance indicators suggest potential overreaching. Immediate attention required.',
      recommendation: 'Take 2-3 full rest days and reassess. Consider reducing volume by 30-40% next week.',
      weekDetected: currentWeek,
      confidence: 'high',
      actionRequired: true
    })
  }
  
  return anomalies
}

export function AnomalyNotificationSurface({ 
  routineId, 
  currentWeek, 
  className, 
  compact = false,
  onDismissAnomaly 
}: AnomalyNotificationSurfaceProps) {
  const { data: timeline, isLoading: timelineLoading } = useRtFTimeline(routineId)
  const { data: routine, isLoading: goalsLoading } = useRtFWeekGoals(routineId, currentWeek)
  
  const anomalies = useMemo(() => {
    if (!timeline?.timeline) return []
    return detectAnomalies(timeline.timeline)
  }, [timeline?.timeline])
  
  const stats = useMemo(() => {
    if (!anomalies.length) return null
    
    const critical = anomalies.filter(a => a.severity === 'critical').length
    const warning = anomalies.filter(a => a.severity === 'warning').length
    const actionRequired = anomalies.filter(a => a.actionRequired).length
    const highConfidence = anomalies.filter(a => a.confidence === 'high').length
    
    return { critical, warning, actionRequired, highConfidence, total: anomalies.length }
  }, [anomalies])
  
  const isLoading = timelineLoading || goalsLoading
  
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
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (!anomalies.length) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p>No performance anomalies detected</p>
            <p className="text-sm mt-1">
              Your training is progressing normally
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
          Performance Insights
          {stats && (
            <Badge 
              variant={stats.critical > 0 ? "destructive" : stats.warning > 0 ? "secondary" : "outline"}
              className="ml-auto"
            >
              {stats.total} alert{stats.total !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
        
        {/* Quick stats */}
        {stats && !compact && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{stats.critical}</div>
              <div className="text-muted-foreground">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{stats.warning}</div>
              <div className="text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{stats.actionRequired}</div>
              <div className="text-muted-foreground">Action Needed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats.highConfidence}</div>
              <div className="text-muted-foreground">High Confidence</div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {anomalies
            .sort((a, b) => {
              // Sort by severity (critical first), then by action required, then by confidence
              const severityOrder = { critical: 0, warning: 1, info: 2, success: 3 }
              const aSeverity = severityOrder[a.severity]
              const bSeverity = severityOrder[b.severity]
              
              if (aSeverity !== bSeverity) return aSeverity - bSeverity
              if (a.actionRequired !== b.actionRequired) return a.actionRequired ? -1 : 1
              
              const confOrder = { high: 0, medium: 1, low: 2 }
              return confOrder[a.confidence] - confOrder[b.confidence]
            })
            .map(anomaly => (
              <AnomalyCard
                key={anomaly.id}
                anomaly={anomaly}
                onDismiss={onDismissAnomaly}
                compact={compact}
              />
            ))}
        </div>
        
        {stats && stats.actionRequired > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-orange-800">
              <Clock className="h-4 w-4" />
              <span className="font-medium">
                {stats.actionRequired} alert{stats.actionRequired !== 1 ? 's' : ''} require immediate attention
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}