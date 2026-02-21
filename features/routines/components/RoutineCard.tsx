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
import { Badge } from '@/components/ui/badge'
import { ProgramStatusBadge } from './ProgramStatusBadge'
import { RoutineProgress } from './RoutineProgress'
import { RoutineMetaBadges } from './RoutineMetaBadges'
import { weekdayName, getTodayDow, validateWorkoutDate, validateRoutineDayDate } from '@/lib/utils/date'
import { onPressEnterOrSpace } from '@/lib/utils/a11y'

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
  
  // Date validation for workout scheduling
  const todayDow = getTodayDow()
  const workoutValidation = validateWorkoutDate(routine.days)
  const canStartToday = workoutValidation.isValid
  const todayRoutineDay = routine.days?.find(day => day.dayOfWeek === todayDow)
  
  // Determine if the start button should be disabled based on validation and routine state
  const isStartDisabled = (isStarting && startActingId === routine.id) || 
                          isProgramEnded(routine) || 
                          (!isActiveRoutine && !canStartToday)

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-md',
        isActiveRoutine &&
          'border-l-4 border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/20',
      )}
    >
      <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-sm font-semibold leading-tight sm:text-base truncate">
                {routine.name}
              </CardTitle>
              {routine.programEndDate && <ProgramStatusBadge routine={routine} />}
            </div>
            {routine.description && (
              <CardDescription className="line-clamp-1 text-xs leading-relaxed">
                {routine.description}
              </CardDescription>
            )}
            {/* Day-of-week schedule badges */}
            {routine.days && routine.days.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {routine.days.map((day) => (
                  <Badge
                    key={day.id}
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-5 font-normal text-muted-foreground"
                  >
                    {weekdayName(day.dayOfWeek, 'short')}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 flex-shrink-0 touch-manipulation">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {routine.days.length > 0 && (
                <>
                  <DropdownMenuItem className="pointer-events-none opacity-60">
                    Start session with day
                  </DropdownMenuItem>
                  {routine.days.map((d) => {
                    const dayValidation = validateRoutineDayDate(d);
                    const canStartThisDay = dayValidation.isValid;
                    
                    return (
                      <DropdownMenuItem
                        key={d.id}
                        onSelect={() => onStartSession(routine, d.id)}
                        disabled={(isStarting && startActingId === routine.id) || isProgramEnded(routine) || !canStartThisDay}
                        title={!canStartThisDay ? `This day is not scheduled for ${weekdayName(d.dayOfWeek, 'long')}` : undefined}
                      >
                        {weekdayName(d.dayOfWeek, 'short')}
                      </DropdownMenuItem>
                    );
                  })}
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
      
      <CardContent className="p-3 pt-1 sm:p-4 sm:pt-2 space-y-2">
        <div className="flex items-center gap-1.5">
          <RoutineMetaBadges daysPerWeek={routine.days.length} isPeriodized={routine.isPeriodized} />
        </div>
        
        <RoutineProgress completed={routine.isCompleted} />
        
        <div className="flex items-center gap-1.5 pt-1">
          {isActiveRoutine ? (
            <Button
              type="button"
              variant="classical"
              size="sm"
              className="h-8 flex-1 sm:flex-initial sm:min-w-[120px] relative pl-6 text-xs font-medium touch-manipulation"
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
              <span className="absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-current opacity-70 animate-pulse" />
              Resume
            </Button>
          ) : (
            <Button
              type="button"
              variant="classical"
              size="sm"
              className="h-8 flex-1 sm:flex-initial sm:min-w-[120px] text-xs font-medium touch-manipulation"
              aria-label="Start session"
              onClick={(e) => {
                e.preventDefault()
                if (canStartToday) {
                  onStartSession(routine, todayRoutineDay?.id)
                }
              }}
              onKeyDown={(e) => {
                onPressEnterOrSpace(() => {
                  if (canStartToday) {
                    onStartSession(routine, todayRoutineDay?.id)
                  }
                })(e)
              }}
              disabled={isStartDisabled}
              title={!canStartToday ? `This workout is not scheduled for ${weekdayName(todayDow, 'long')}` : undefined}
              {...preloadOnHover('activeWorkoutSession')}
            >
              {isStarting && startActingId === routine.id ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <ClassicalIcon name="dumbbell" className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              )}
              {lastStartReused ? 'Resume' : 'Start'}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 touch-manipulation active:scale-95 transition-transform"
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
                className="h-4 w-4 text-emerald-600 transition-colors"
                fill={routine.isCompleted ? 'currentColor' : 'none'}
              />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 touch-manipulation active:scale-95 transition-transform"
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
                className="h-4 w-4 text-rose-500 transition-all"
                fill={routine.isFavorite ? 'currentColor' : 'none'}
              />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}