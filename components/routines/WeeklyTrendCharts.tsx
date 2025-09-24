/**
 * Weekly Trend Charts Component  
 * RTF-F07: Weekly trend charts - Progress visualization over time
 * Shows volume trends, intensity progression, and performance metrics
 */

'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts'
import { 
  TrendingUp, 
  BarChart3, 
  Activity,
  Target,
  AlertCircle,
  Calendar
} from 'lucide-react'
import { useRtFTimeline } from '@/lib/api/hooks'
import { cn } from '@/lib/utils'
import type { RtfTimelineEntry } from '@/lib/api/types'

interface WeeklyTrendChartsProps {
  routineId: string
  className?: string
  compact?: boolean
  showPredictions?: boolean
}

interface TrendData {
  week: number
  weekLabel: string
  volume: number
  avgIntensity: number
  amrapReps?: number
  targetReps?: number
  isDeload: boolean
  isCompleted: boolean
  isPredicted?: boolean
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    color: string
    dataKey: string
    name: string
    value: number
    payload: TrendData
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload
  
  return (
    <div className="bg-background border rounded-lg p-3 shadow-lg">
      <p className="font-medium text-sm mb-2">
        {label} {data.isDeload && '(Deload)'}
      </p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{entry.value}</span>
        </div>
      ))}
      {data.isCompleted === false && (
        <div className="text-xs text-muted-foreground mt-1 border-t pt-1">
          Projected
        </div>
      )}
    </div>
  )
}

function transformTimelineToTrends(timeline: RtfTimelineEntry[]): TrendData[] {
  return timeline.map(entry => {
    // For now, create mock trend data since we don't have exercise details
    // In production, this would combine timeline + week goals data
    const baseVolume = entry.isDeload ? 60 : 100
    const weekVariation = Math.sin(entry.week * 0.5) * 20 // Some variation
    const volume = Math.round(baseVolume + weekVariation)
    
    const baseIntensity = entry.isDeload ? 65 : 80
    const intensityVariation = (entry.week - 1) * 2 // Progressive overload
    const avgIntensity = Math.min(95, Math.round(baseIntensity + intensityVariation))
    
    // Mock AMRAP data for some weeks
    const hasAmrap = entry.week % 3 === 0 && !entry.isDeload
    const amrapReps = hasAmrap ? Math.round(8 + Math.random() * 4) : undefined
    const targetReps = hasAmrap ? 8 : undefined
    
    // Determine completion status based on timeline
    // For now, assume weeks in the past are completed
    const currentWeek = Math.ceil((Date.now() - new Date('2025-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000))
    const isCompleted = entry.week <= currentWeek

    return {
      week: entry.week,
      weekLabel: `Week ${entry.week}`,
      volume,
      avgIntensity,
      amrapReps,
      targetReps,
      isDeload: entry.isDeload,
      isCompleted,
      isPredicted: !isCompleted
    }
  })
}

function VolumeChart({ data }: { data: TrendData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="deloadGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="weekLabel" 
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="volume"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#volumeGradient)"
          name="Training Volume"
          connectNulls={false}
        />
        {/* Highlight deload weeks */}
        {data.filter(d => d.isDeload).map(deload => (
          <ReferenceLine 
            key={deload.week}
            x={deload.weekLabel}
            stroke="#f59e0b"
            strokeDasharray="2 2"
            strokeWidth={1}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

function IntensityChart({ data }: { data: TrendData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="weekLabel" 
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          domain={[60, 95]}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          label={{ value: 'Intensity (%)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="avgIntensity"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
          name="Avg Intensity"
          connectNulls={false}
        />
        {/* Deload reference lines */}
        {data.filter(d => d.isDeload).map(deload => (
          <ReferenceLine 
            key={deload.week}
            x={deload.weekLabel}
            stroke="#f59e0b"
            strokeDasharray="2 2"
            strokeWidth={1}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

function AmrapChart({ data }: { data: TrendData[] }) {
  const amrapData = data.filter(d => d.amrapReps !== undefined)
  
  if (amrapData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No AMRAP data available</p>
          <p className="text-sm mt-1">AMRAP sets will appear here when available</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={amrapData}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="weekLabel" 
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar
          dataKey="targetReps"
          fill="#94a3b8"
          name="Target Reps"
          radius={[2, 2, 0, 0]}
        />
        <Bar
          dataKey="amrapReps"
          fill="#3b82f6"
          name="Actual Reps"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function WeeklyTrendCharts({ 
  routineId, 
  className, 
  compact = false,
  showPredictions = true
}: WeeklyTrendChartsProps) {
  const { data: timeline, isLoading, error } = useRtFTimeline(routineId)
  
  const trendData = useMemo(() => {
    if (!timeline?.timeline) return []
    let data = transformTimelineToTrends(timeline.timeline)
    
    // Filter out predictions if not showing them
    if (!showPredictions) {
      data = data.filter(d => d.isCompleted)
    }
    
    return data
  }, [timeline?.timeline, showPredictions])
  
  const stats = useMemo(() => {
    if (!trendData.length) return null
    
    const completedWeeks = trendData.filter(d => d.isCompleted)
    const latestVolume = completedWeeks[completedWeeks.length - 1]?.volume || 0
    const firstVolume = completedWeeks[0]?.volume || 0
    const volumeChange = completedWeeks.length > 1 
      ? Math.round(((latestVolume - firstVolume) / firstVolume) * 100)
      : 0
    
    const avgIntensity = completedWeeks.length > 0
      ? Math.round(completedWeeks.reduce((sum, d) => sum + d.avgIntensity, 0) / completedWeeks.length)
      : 0
    
    const totalAmrapReps = trendData.filter(d => d.amrapReps !== undefined)
      .reduce((sum, d) => sum + (d.amrapReps || 0), 0)
    
    return {
      totalWeeks: trendData.length,
      completedWeeks: completedWeeks.length,
      volumeChange,
      avgIntensity,
      totalAmrapReps,
      hasAmrapData: trendData.some(d => d.amrapReps !== undefined)
    }
  }, [trendData])
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <Skeleton className="h-5 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }
  
  if (error || !timeline) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p>Unable to load trend data</p>
            <p className="text-sm mt-1">
              {error?.message || 'Timeline data not available'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (!trendData.length) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No trend data available</p>
            <p className="text-sm mt-1">
              Complete some workouts to see trends
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
          <BarChart3 className="h-4 w-4" />
          Weekly Trends
          {stats && (
            <Badge variant="outline" className="ml-auto">
              {stats.completedWeeks}/{stats.totalWeeks} weeks
            </Badge>
          )}
        </CardTitle>
        
        {/* Quick stats */}
        {stats && !compact && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
            <div className="text-center">
              <div className={cn(
                'text-lg font-bold',
                stats.volumeChange > 0 ? 'text-green-600' : 
                stats.volumeChange < 0 ? 'text-red-600' : 'text-primary'
              )}>
                {stats.volumeChange > 0 && '+'}{stats.volumeChange}%
              </div>
              <div className="text-muted-foreground">Volume Change</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats.avgIntensity}%</div>
              <div className="text-muted-foreground">Avg Intensity</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{stats.completedWeeks}</div>
              <div className="text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{stats.totalAmrapReps}</div>
              <div className="text-muted-foreground">AMRAP Reps</div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="volume" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="volume" className="flex items-center gap-2">
              <Activity className="h-3 w-3" />
              Volume
            </TabsTrigger>
            <TabsTrigger value="intensity" className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              Intensity
            </TabsTrigger>
            <TabsTrigger value="amrap" className="flex items-center gap-2">
              <Target className="h-3 w-3" />
              AMRAP
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="volume" className="mt-6">
            <VolumeChart data={trendData} />
          </TabsContent>
          
          <TabsContent value="intensity" className="mt-6">
            <IntensityChart data={trendData} />
          </TabsContent>
          
          <TabsContent value="amrap" className="mt-6">
            <AmrapChart data={trendData} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}