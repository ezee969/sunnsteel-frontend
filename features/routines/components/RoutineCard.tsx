"use client"

import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Loader2, Heart, ListChecks } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useComponentPreloading } from '@/lib/utils/dynamic-imports'
import { ClassicalIcon } from '@/components/icons/ClassicalIcon'
import type { Routine } from '@/lib/api/types/routine.type'
import { ProgramStatusBadge } from './ProgramStatusBadge'
import { RoutineProgress } from './RoutineProgress'
import { RoutineMetaBadges } from './RoutineMetaBadges'
import { weekdayName } from '@/lib/utils/date'
import { onPressEnterOrSpace } from '@/lib/utils/a11y'

/**
 * Determine whether a routine's program has ended by comparing today's UTC date to the routine's programEndDate.
 *
 * @param routine - Routine to check; may be undefined or lack a programEndDate
 * @returns `true` if today's UTC date is after the routine's `programEndDate`, `false` otherwise
 */
function isProgramEnded(routine: Routine | undefined): boolean {
  if (!routine?.programEndDate) return false
  const today = new Date()
  const todayUTC = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )
  const end = new Date(routine.programEndDate)
  const endUTC = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate(),
  )
  return todayUTC > endUTC
}

export interface RoutineCardProps {
  routine: Routine
  isActiveRoutine: boolean
  activeSessionId?: string
  onStartSession: (routine: Routine, routineDayId?: string) => void
  onToggleCompleted: (routine: Routine) => void
  onToggleFavorite: (routine: Routine) => void
  onDelete: (routineId: string) => void
  isStarting: boolean
  startActingId: string | null
  lastStartReused: boolean
  isTogglingCompleted: boolean
  completedActingId: string | null
  isTogglingFavorite: boolean
  favoriteActingId: string | null
}

/**
 * Renders a card UI for a routine, including name/description, program status, start/resume controls,
 * completion and favorite toggles, per-day start options, progress, and metadata badges.
 *
 * @param routine - The routine to display
 * @param isActiveRoutine - Whether this routine is the currently active routine
 * @param activeSessionId - ID of the active workout session, used when resuming
 * @param onStartSession - Callback to start a session for the routine; optionally accepts a routineDayId
 * @param onToggleCompleted - Callback to toggle the routine's completed state
 * @param onToggleFavorite - Callback to toggle the routine's favorite state
 * @param onDelete - Callback to delete the routine by id
 * @param isStarting - Whether a start action is currently in progress
 * @param startActingId - ID of the routine currently performing a start action
 * @param lastStartReused - Whether the last start action reused an existing session (affects label)
 * @param isTogglingCompleted - Whether a completed-toggle action is currently in progress
 * @param completedActingId - ID of the routine currently performing a completed-toggle action
 * @param isTogglingFavorite - Whether a favorite-toggle action is currently in progress
 * @param favoriteActingId - ID of the routine currently performing a favorite-toggle action
 * @returns The JSX element for the routine card
 */
export function RoutineCard({
  routine,
  isActiveRoutine,
  activeSessionId,
  onStartSession,
  onToggleCompleted,
  onToggleFavorite,
  onDelete,
  isStarting,
  startActingId,
  lastStartReused,
  isTogglingCompleted,
  completedActingId,
  isTogglingFavorite,
  favoriteActingId,
}: RoutineCardProps) {
  const router = useRouter()
  const { preloadOnHover } = useComponentPreloading()

  return (
    <Card
      className={cn(
        'transition-colors',
        isActiveRoutine &&
          'border-l-4 border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/20',
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 sm:px-6 sm:py-4">
        <div className="space-y-1 pr-2">
          <CardTitle className="text-base font-semibold sm:text-lg">
            {routine.name}
          </CardTitle>
          {routine.description && (
            <CardDescription className="line-clamp-2 text-sm sm:text-base">
              {routine.description}
            </CardDescription>
          )}
        </div>
        <div className="flex items-center gap-1">
          {routine.programEndDate && <ProgramStatusBadge routine={routine} />}
          {isActiveRoutine ? (
            <Button
              type="button"
              variant="classical"
              size="sm"
              className="h-8 relative pl-6 pr-3"
              aria-label="Resume active workout session"
              onClick={(e) => {
                e.preventDefault()
                if (activeSessionId) {
                  router.push(`/workouts/sessions/${activeSessionId}`)
                }
              }}
              onKeyDown={(e) => {
                onPressEnterOrSpace(() => {
                  if (activeSessionId) {
                    router.push(`/workouts/sessions/${activeSessionId}`)
                  }
                })(e)
              }}
              {...preloadOnHover('activeWorkoutSession')}
            >
              <span className="absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-current opacity-70" />
              Resume
            </Button>
          ) : (
            <Button
              type="button"
              variant="classical"
              size="sm"
              className="h-8"
              aria-label="Start session"
              onClick={(e) => {
                e.preventDefault()
                onStartSession(routine)
              }}
              onKeyDown={(e) => {
                onPressEnterOrSpace(() => onStartSession(routine))(e)
              }}
              disabled={
                (isStarting && startActingId === routine.id) || isProgramEnded(routine)
              }
              {...preloadOnHover('activeWorkoutSession')}
            >
              {isStarting && startActingId === routine.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ClassicalIcon name="dumbbell" className="mr-2 h-4 w-4" aria-hidden />
              )}
              {lastStartReused ? 'Resume' : 'Start'}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={routine.isCompleted ? 'Unmark completed' : 'Mark as completed'}
            disabled
            aria-pressed={routine.isCompleted}
            onClick={() => onToggleCompleted(routine)}
            onKeyDown={(e) => {
              onPressEnterOrSpace(() => onToggleCompleted(routine))(e)
            }}
          >
            {isTogglingCompleted && completedActingId === routine.id ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />)
            : (
              <ListChecks
                className="h-4 w-4 text-emerald-600"
                fill={routine.isCompleted ? 'currentColor' : 'none'}
              />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={routine.isFavorite ? 'Unmark favorite' : 'Mark as favorite'}
            aria-pressed={routine.isFavorite}
            onClick={() => onToggleFavorite(routine)}
            onKeyDown={(e) => {
              onPressEnterOrSpace(() => onToggleFavorite(routine))(e)
            }}
            disabled={isTogglingFavorite && favoriteActingId === routine.id}
          >
            {isTogglingFavorite && favoriteActingId === routine.id ? (
              <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
            ) : (
              <Heart
                className="h-4 w-4 text-rose-500"
                fill={routine.isFavorite ? 'currentColor' : 'none'}
              />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {routine.days.length > 0 && (
                <>
                  <DropdownMenuItem className="pointer-events-none opacity-60">
                    Start session with day
                  </DropdownMenuItem>
                  {routine.days.map((d) => (
                    <DropdownMenuItem
                      key={d.id}
                      onSelect={() => onStartSession(routine, d.id)}
                      disabled={(isStarting && startActingId === routine.id) || isProgramEnded(routine)}
                    >
                      {weekdayName(d.dayOfWeek, 'short')}
                    </DropdownMenuItem>
                  ))}
                  <div className="my-1 h-px bg-border" />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link href={`/routines/${routine.id}`}>Open</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/routines/edit/${routine.id}`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onSelect={() => onDelete(routine.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:px-6 sm:pb-4 sm:pt-0">
        <RoutineProgress completed={routine.isCompleted} />
        <RoutineMetaBadges daysPerWeek={routine.days.length} isPeriodized={routine.isPeriodized} />
      </CardContent>
    </Card>
  )
}
