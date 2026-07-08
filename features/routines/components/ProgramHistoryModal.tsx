/**
 * Program History Modal Component
 * RTF-F09: Program history modal - Training program snapshots and evolution tracking
 * Uses live timeline/forecast data to show weekly program evolution.
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Clock,
  Edit,
  GitBranch,
  History,
  Minus,
  Plus,
  Target,
  TrendingUp,
  User,
} from 'lucide-react'
import { useRtFForecast, useRtFTimeline } from '@/lib/api/hooks'
import type { ProgramChange, ProgramSnapshot } from './program-history.utils'
import { buildSnapshots } from './program-history.utils'
import { cn } from '@/lib/utils'

interface ProgramHistoryModalProps {
  routineId: string
  routineName: string
  trigger?: React.ReactNode
}

interface SnapshotCardProps {
  snapshot: ProgramSnapshot
  isLatest?: boolean
  onSelect?: (snapshot: ProgramSnapshot) => void
  isSelected?: boolean
}

interface ChangesDiffProps {
  changes: ProgramChange[]
  compact?: boolean
}

function getChangeIcon(type: ProgramChange['type']) {
  switch (type) {
    case 'exercise_added':
      return <Plus className="h-3 w-3 text-green-600" />
    case 'exercise_removed':
      return <Minus className="h-3 w-3 text-red-600" />
    case 'exercise_modified':
      return <Edit className="h-3 w-3 text-blue-600" />
    case 'intensity_changed':
      return <TrendingUp className="h-3 w-3 text-orange-600" />
    case 'reps_changed':
      return <Target className="h-3 w-3 text-purple-600" />
    case 'sets_changed':
      return <Target className="h-3 w-3 text-cyan-600" />
    default:
      return <Edit className="h-3 w-3 text-gray-600" />
  }
}

function getImpactColor(impact: ProgramChange['impact']): string {
  switch (impact) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function ChangesDiff({ changes, compact = false }: ChangesDiffProps) {
  if (!changes.length) {
    return (
      <div className="text-center text-muted-foreground py-4">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No changes recorded</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {changes.map((change) => (
        <div
          key={`${change.exerciseName}-${change.type}-${change.field ?? 'n/a'}`}
          className="flex items-start gap-3 p-3 border rounded-lg"
        >
          <div className="flex-shrink-0 mt-0.5">{getChangeIcon(change.type)}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('font-medium', compact ? 'text-sm' : 'text-base')}>
                {change.exerciseName}
              </span>
              <Badge
                variant="outline"
                className={cn('text-xs px-2 py-0.5', getImpactColor(change.impact))}
              >
                {change.impact} impact
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground">
              {change.type === 'exercise_added' && 'Target block added'}
              {change.type === 'exercise_removed' && 'Target block removed'}
              {change.type === 'exercise_modified' && change.field && (
                <>
                  {change.field} changed from{' '}
                  <span className="line-through text-red-600">{change.oldValue}</span>
                  {' -> '}
                  <span className="text-green-600 font-medium">{change.newValue}</span>
                </>
              )}
              {(change.type === 'intensity_changed' ||
                change.type === 'reps_changed' ||
                change.type === 'sets_changed') && (
                <>
                  {change.field || change.type.replace('_changed', '')} updated from{' '}
                  <span className="line-through text-red-600">{change.oldValue}</span>
                  {' -> '}
                  <span className="text-green-600 font-medium">{change.newValue}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SnapshotCard({
  snapshot,
  isLatest = false,
  onSelect,
  isSelected = false,
}: SnapshotCardProps) {
  const { version, timestamp, author, description, weekContext, changes, metadata } = snapshot

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:bg-muted/50',
        isSelected && 'ring-2 ring-primary',
        isLatest && 'border-green-500',
      )}
      onClick={() => onSelect?.(snapshot)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-sm">Version {version}</CardTitle>
              {isLatest && (
                <Badge variant="default" className="text-xs">
                  Latest
                </Badge>
              )}
              {weekContext && (
                <Badge variant="outline" className="text-xs">
                  Week {weekContext}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{new Date(timestamp).toLocaleDateString()}</span>
              <span>|</span>
              <User className="h-3 w-3" />
              <span>{author}</span>
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3">{description}</p>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="font-medium">{changes.length} changes</div>
            <div className="text-muted-foreground">Modifications</div>
          </div>
          <div>
            <div className="font-medium">{metadata.targetBlocks}</div>
            <div className="text-muted-foreground">Target blocks</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProgramHistoryModal({ routineId, routineName, trigger }: ProgramHistoryModalProps) {
  const [selectedSnapshot, setSelectedSnapshot] = useState<ProgramSnapshot | null>(null)
  const [activeTab, setActiveTab] = useState<'timeline' | 'changes' | 'stats'>('timeline')

  const {
    data: timeline,
    isLoading: timelineLoading,
    error: timelineError,
  } = useRtFTimeline(routineId)
  const {
    data: forecast,
    isLoading: forecastLoading,
    error: forecastError,
  } = useRtFForecast(routineId, { remaining: false })

  const snapshots = useMemo(() => buildSnapshots(timeline, forecast), [timeline, forecast])
  const latestSnapshot = snapshots[snapshots.length - 1] ?? null
  const isLoading = timelineLoading || forecastLoading
  const hasTimelineError = !!timelineError

  useEffect(() => {
    if (!latestSnapshot) {
      setSelectedSnapshot(null)
      return
    }

    if (!selectedSnapshot) {
      setSelectedSnapshot(latestSnapshot)
      return
    }

    if (!snapshots.some((snapshot) => snapshot.id === selectedSnapshot.id)) {
      setSelectedSnapshot(latestSnapshot)
    }
  }, [latestSnapshot, selectedSnapshot, snapshots])

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-2" />
            Program History
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Program History - {routineName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[70vh]">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4" />
              <h3 className="font-semibold">Program Versions</h3>
              <Badge variant="outline">{snapshots.length}</Badge>
            </div>

            {forecastError && !hasTimelineError && (
              <div className="mb-3 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                Forecast details are partially unavailable; showing timeline-derived history.
              </div>
            )}

            <ScrollArea className="h-full pr-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 w-full" />
                  ))}
                </div>
              ) : hasTimelineError ? (
                <div className="rounded-md border border-red-300 bg-red-50 px-3 py-3 text-sm text-red-700">
                  Unable to load program history.
                </div>
              ) : snapshots.length === 0 ? (
                <div className="rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
                  No program history available for this routine yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {snapshots
                    .slice()
                    .reverse()
                    .map((snapshot) => (
                      <SnapshotCard
                        key={snapshot.id}
                        snapshot={snapshot}
                        isLatest={snapshot.id === latestSnapshot?.id}
                        onSelect={setSelectedSnapshot}
                        isSelected={selectedSnapshot?.id === snapshot.id}
                      />
                    ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <Separator orientation="vertical" className="hidden lg:block" />

          <div className="lg:col-span-3">
            {selectedSnapshot ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-semibold">Version {selectedSnapshot.version} Details</h3>
                  {selectedSnapshot.id === latestSnapshot?.id && <Badge>Current</Badge>}
                </div>

                <Tabs
                  value={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(value as 'timeline' | 'changes' | 'stats')
                  }
                  className="flex-1"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="changes">Changes</TabsTrigger>
                    <TabsTrigger value="stats">Statistics</TabsTrigger>
                  </TabsList>

                  <TabsContent value="timeline" className="flex-1">
                    <ScrollArea className="h-full">
                      <div className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Change Summary</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Change Type:</span>
                                <Badge variant="outline" className="capitalize">
                                  {selectedSnapshot.changeType.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>Date:</span>
                                <span>{new Date(selectedSnapshot.timestamp).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Author:</span>
                                <span>{selectedSnapshot.author}</span>
                              </div>
                              {selectedSnapshot.weekContext && (
                                <div className="flex justify-between">
                                  <span>Week Context:</span>
                                  <span>Week {selectedSnapshot.weekContext}</span>
                                </div>
                              )}
                            </div>
                            <Separator className="my-3" />
                            <p className="text-sm text-muted-foreground">
                              {selectedSnapshot.description}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="changes" className="flex-1">
                    <ScrollArea className="h-full">
                      <ChangesDiff changes={selectedSnapshot.changes} />
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="stats" className="flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <div className="text-2xl font-bold">
                            {selectedSnapshot.metadata.targetBlocks}
                          </div>
                          <div className="text-sm text-muted-foreground">Target Blocks</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <div className="text-2xl font-bold">
                            {selectedSnapshot.metadata.avgIntensity}%
                          </div>
                          <div className="text-sm text-muted-foreground">Avg Intensity</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <div className="text-2xl font-bold">
                            {selectedSnapshot.metadata.estimatedVolume}
                          </div>
                          <div className="text-sm text-muted-foreground">Volume Index</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <div className="text-2xl font-bold">
                            {selectedSnapshot.metadata.hasForecastData ? 'Yes' : 'No'}
                          </div>
                          <div className="text-sm text-muted-foreground">Forecast Data</div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                <div>
                  <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select a program version</p>
                  <p className="text-sm">Choose a snapshot from the left to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

