'use client'

import { useParams, useRouter } from 'next/navigation'
import { useDeleteSetLog, useFinishSession, useSession, useUpsertSetLog } from '@/lib/api/hooks/useWorkoutSession'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Loader2, MoveLeft, Square, Trash } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { useRoutine } from '@/lib/api/hooks/useRoutines'
import type { Routine } from '@/lib/api/types/routine.type'

const formatTime = (iso?: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ActiveSessionPage() {
  const params = useParams<{ id: string | string[] }>()
  const router = useRouter()
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id

  const { data: session, isLoading, error } = useSession(idParam)
  const { mutate: finishSession, isPending: finishing } = useFinishSession(idParam)
  const { mutate: upsertSetLog, isPending: savingLog } = useUpsertSetLog(idParam)
  const { data: routine } = useRoutine(session?.routineId ?? '')
  const { mutate: deleteSetLog, isPending: removingLog } = useDeleteSetLog(idParam)

  const handleBack = () => router.back()

  const handleFinish = (status: 'COMPLETED' | 'ABORTED') => {
    finishSession(
      { status },
      {
        onSuccess: () => {
          router.push('/dashboard')
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="p-4">
        <Button variant="ghost" size="sm" onClick={handleBack} aria-label="Go back">
          <MoveLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <p className="mt-4 text-destructive">Failed to load session.</p>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 max-w-2xl mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handleBack} aria-label="Go back">
          <MoveLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{session.status.replace('_', ' ')}</Badge>
          <Badge variant="outline">Started {formatTime(session.startedAt)}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Dumbbell className="h-5 w-5" /> Active Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Routine: <span className="font-medium">{session.routineId}</span>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => handleFinish('COMPLETED')}
              disabled={finishing}
              aria-label="Finish session"
            >
              {finishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Square className="mr-2 h-4 w-4" />
              )}
              Finish
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => handleFinish('ABORTED')}
              disabled={finishing}
              aria-label="Abort session"
            >
              Abort
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Set Logs List (grouped by exercise when routine is available) */}
      <div className="mt-4 space-y-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Set Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!session.setLogs || session.setLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No set logs yet.</p>
            ) : !routine ? (
              // Fallback simple list while routine metadata loads
              <div className="space-y-3">
                {session.setLogs.map((log) => (
                  <LogRow
                    key={log.id}
                    setLogId={log.id}
                    routineExerciseId={log.routineExerciseId}
                    exerciseId={log.exerciseId}
                    setNumber={log.setNumber}
                    repsInitial={log.reps}
                    weightInitial={log.weight}
                    rpeInitial={log.rpe}
                    isCompletedInitial={log.isCompleted}
                    onSave={(payload) => upsertSetLog(payload)}
                    onRemove={({ routineExerciseId, setNumber }) =>
                      deleteSetLog({ routineExerciseId, setNumber })
                    }
                    saving={savingLog}
                    removing={removingLog}
                  />
                ))}
              </div>
            ) : (
              // Group by exercise using routine + routineDay metadata
              <GroupedLogs
                logs={session.setLogs}
                routineId={session.routineId}
                routineDayId={session.routineDayId}
                routine={routine}
                onSave={(payload) => upsertSetLog(payload)}
                onRemove={({ routineExerciseId, setNumber }) =>
                  deleteSetLog({ routineExerciseId, setNumber })
                }
                saving={savingLog}
                removing={removingLog}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

type LogRowProps = {
  setLogId: string
  routineExerciseId: string
  exerciseId: string
  setNumber: number
  repsInitial: number
  weightInitial?: number
  rpeInitial?: number
  isCompletedInitial: boolean
  saving: boolean
  removing?: boolean
  onSave: (payload: {
    routineExerciseId: string
    exerciseId: string
    setNumber: number
    reps: number
    weight?: number
    rpe?: number
    isCompleted?: boolean
  }) => void
  onRemove: (payload: { routineExerciseId: string; setNumber: number }) => void
}

type GroupedLogsProps = {
  logs: Array<{
    id: string
    routineExerciseId: string
    exerciseId: string
    setNumber: number
    reps: number
    weight?: number
    rpe?: number
    isCompleted: boolean
  }>
  routineId: string
  routineDayId: string
  routine: Routine
  saving: boolean
  removing?: boolean
  onSave: LogRowProps['onSave']
  onRemove: LogRowProps['onRemove']
}

const GroupedLogs = ({ logs, routine, routineDayId, saving, removing, onSave, onRemove }: GroupedLogsProps) => {
  const day = routine.days.find((d) => d.id === routineDayId)
  if (!day) {
    return (
      <div className="space-y-3">
        {logs.map((log) => (
          <LogRow
            key={log.id}
            setLogId={log.id}
            routineExerciseId={log.routineExerciseId}
            exerciseId={log.exerciseId}
            setNumber={log.setNumber}
            repsInitial={log.reps}
            weightInitial={log.weight}
            rpeInitial={log.rpe}
            isCompletedInitial={log.isCompleted}
            onSave={onSave}
            onRemove={onRemove}
            saving={saving}
            removing={removing}
          />
        ))}
      </div>
    )
  }

  const exerciseMeta = new Map(
    day.exercises.map((re) => [re.id, { name: re.exercise.name, order: re.order, exerciseId: re.exercise.id }]),
  )

  type Log = GroupedLogsProps['logs'][number]
  const groupMap = new Map<string, Log[]>()
  for (const log of logs) {
    const arr = groupMap.get(log.routineExerciseId) ?? []
    arr.push(log)
    groupMap.set(log.routineExerciseId, arr)
  }

  const groups = Array.from(groupMap.entries()).sort((a, b) => {
    const aOrder = exerciseMeta.get(a[0])?.order ?? 0
    const bOrder = exerciseMeta.get(b[0])?.order ?? 0
    return aOrder - bOrder
  })

  return (
    <div className="space-y-4">
      {groups.map(([reId, groupLogs]) => {
        const meta = exerciseMeta.get(reId)
        const title = meta?.name ?? 'Exercise'
        const sorted = [...groupLogs].sort((x, y) => x.setNumber - y.setNumber)
        return (
          <div key={reId} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{title}</div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                aria-label={`Add set for ${title}`}
                onClick={() => {
                  const next = (sorted[sorted.length - 1]?.setNumber ?? 0) + 1
                  if (!meta?.exerciseId) return
                  onSave({
                    routineExerciseId: reId,
                    exerciseId: meta.exerciseId,
                    setNumber: next,
                    reps: 0,
                    weight: undefined,
                    rpe: undefined,
                    isCompleted: false,
                  })
                }}
              >
                + Set
              </Button>
            </div>
            <div className="space-y-2">
              {sorted.map((log) => (
                <LogRow
                  key={log.id}
                  setLogId={log.id}
                  routineExerciseId={log.routineExerciseId}
                  exerciseId={log.exerciseId}
                  setNumber={log.setNumber}
                  repsInitial={log.reps}
                  weightInitial={log.weight}
                  rpeInitial={log.rpe}
                  isCompletedInitial={log.isCompleted}
                  onSave={onSave}
                  onRemove={onRemove}
                  saving={saving}
                  removing={removing}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const LogRow = ({
  routineExerciseId,
  exerciseId,
  setNumber,
  repsInitial,
  weightInitial,
  rpeInitial,
  isCompletedInitial,
  saving,
  removing,
  onSave,
  onRemove,
}: LogRowProps) => {
  const [reps, setReps] = useState<number>(repsInitial)
  const [weight, setWeight] = useState<number | undefined>(weightInitial)
  const [rpe, setRpe] = useState<number | undefined>(rpeInitial)
  const [isCompleted, setIsCompleted] = useState<boolean>(isCompletedInitial)

  const handleSave = () => {
    onSave({
      routineExerciseId,
      exerciseId,
      setNumber,
      reps,
      weight,
      rpe,
      isCompleted,
    })
  }

  return (
    <div className="rounded-md border p-3 sm:p-4">
      <div className="mb-2 text-sm font-medium">Set {setNumber}</div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <div className="col-span-1">
          <Input
            type="number"
            inputMode="numeric"
            aria-label="Reps"
            placeholder="Reps"
            value={Number.isFinite(reps) ? reps : ''}
            onChange={(e) => setReps(e.target.value === '' ? 0 : Number(e.target.value))}
            onBlur={handleSave}
          />
        </div>
        <div className="col-span-1">
          <Input
            type="number"
            inputMode="numeric"
            aria-label="Weight"
            placeholder="Weight"
            value={weight ?? ''}
            onChange={(e) => setWeight(e.target.value === '' ? undefined : Number(e.target.value))}
            onBlur={handleSave}
          />
        </div>
        <div className="col-span-1">
          <Input
            type="number"
            inputMode="numeric"
            aria-label="RPE"
            placeholder="RPE"
            value={rpe ?? ''}
            onChange={(e) => setRpe(e.target.value === '' ? undefined : Number(e.target.value))}
            onBlur={handleSave}
          />
        </div>
        <div className="col-span-3 flex items-center justify-end gap-2 sm:col-span-3">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            aria-label={`Remove set ${setNumber}`}
            onClick={() => onRemove({ routineExerciseId, setNumber })}
            disabled={!!removing}
          >
            {removing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
            Remove
          </Button>
          <Button
            type="button"
            variant={isCompleted ? 'secondary' : 'default'}
            size="sm"
            aria-label={isCompleted ? 'Mark as not completed' : 'Mark as completed'}
            onClick={() => {
              setIsCompleted((prev) => {
                const next = !prev
                // autosave on toggle for better mobile UX using next state
                setTimeout(() => {
                  onSave({
                    routineExerciseId,
                    exerciseId,
                    setNumber,
                    reps,
                    weight,
                    rpe,
                    isCompleted: next,
                  })
                }, 0)
                return next
              })
            }}
          >
            {isCompleted ? 'Completed' : 'Not completed'}
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={saving} aria-label="Save set log">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
