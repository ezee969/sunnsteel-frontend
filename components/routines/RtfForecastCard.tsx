/**
 * RTF-F05: Forecast Card Component
 * Displays RTF forecast predictions with confidence indicators and expandable details.
 * Integrates with ETag client for optimal caching performance.
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, TrendingUp, Calendar, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RtfForecast, RtfForecastWeek } from '@/lib/api/types'

interface RtfForecastCardProps {
  forecast: RtfForecast
  targetWeek?: number
  className?: string
}

function ConfidenceIndicator({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const config = {
    high: { 
      color: 'bg-green-500', 
      label: 'High', 
      description: 'Based on consistent performance data'
    },
    medium: { 
      color: 'bg-yellow-500', 
      label: 'Medium', 
      description: 'Some variability in recent performance'
    },
    low: { 
      color: 'bg-red-500', 
      label: 'Low', 
      description: 'Limited or inconsistent data available'
    }
  }
  
  const { color, label, description } = config[confidence]
  
  return (
    <div className="flex items-center gap-1.5" title={description}>
      <div className={cn('w-2 h-2 rounded-full', color)} />
      <span className="text-xs text-muted-foreground">
        {label} Confidence
      </span>
    </div>
  )
}

function WeekSummary({ week, isTargetWeek }: { week: RtfForecastWeek; isTargetWeek: boolean }) {
  if (week.isDeload) {
    return (
      <div className={cn(
        'flex items-center justify-between p-3 rounded-lg border',
        'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
      )}>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-sm">Week {week.week}</span>
          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
            Deload
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">Recovery week</span>
      </div>
    )
  }

  return (
    <div className={cn(
      'flex items-center justify-between p-3 rounded-lg border transition-colors',
      'hover:bg-muted/50',
      isTargetWeek && 'ring-2 ring-primary ring-offset-2'
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">Week {week.week}</span>
          {isTargetWeek && (
            <Badge variant="default" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              Target
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Standard: {((week.standard?.intensity || 0) * 100).toFixed(0)}%</span>
          <span>Hypertrophy: {((week.hypertrophy?.intensity || 0) * 100).toFixed(0)}%</span>
        </div>
      </div>
      
      <div className="text-right">
        <div className="text-sm font-medium">
          {week.standard?.fixedReps || 0} + {week.standard?.amrapTarget || 0}
        </div>
        <div className="text-xs text-muted-foreground">
          Reps structure
        </div>
      </div>
    </div>
  )
}

export function RtfForecastCard({ forecast, targetWeek, className }: RtfForecastCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Calculate summary metrics
  const trainingWeeks = forecast.forecast.filter(week => !week.isDeload)
  const avgIntensity = trainingWeeks.reduce((sum, week) => sum + (week.standard?.intensity || 0), 0) / trainingWeeks.length
  
  // Get target week if specified
  const targetWeekData = targetWeek ? forecast.forecast.find(week => week.week === targetWeek) : null
  
  // Get confidence based on data completeness (simplified heuristic)
  const confidence: 'high' | 'medium' | 'low' = 
    forecast.version >= 1 && trainingWeeks.length >= 15 ? 'high' :
    forecast.version >= 1 && trainingWeeks.length >= 10 ? 'medium' : 'low'
  
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            RTF Forecast
          </CardTitle>
          <ConfidenceIndicator confidence={confidence} />
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold">{forecast.weeks}</div>
            <div className="text-xs text-muted-foreground">Total weeks</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{trainingWeeks.length}</div>
            <div className="text-xs text-muted-foreground">Training weeks</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{(avgIntensity * 100).toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Avg intensity</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {targetWeekData && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2 text-primary">Target Week Preview</h4>
            <WeekSummary week={targetWeekData} isTargetWeek={true} />
          </div>
        )}
        
        {!isExpanded && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium mb-2">Next 3 Weeks</h4>
            {forecast.forecast.slice(0, 3).map((week) => (
              <WeekSummary
                key={week.week}
                week={week}
                isTargetWeek={week.week === targetWeek}
              />
            ))}
          </div>
        )}
        
        {isExpanded && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium mb-2">Complete Forecast ({forecast.weeks} weeks)</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {forecast.forecast.map((week) => (
                <WeekSummary
                  key={week.week}
                  week={week}
                  isTargetWeek={week.week === targetWeek}
                />
              ))}
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Show All {forecast.weeks} Weeks
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
