/**
 * RTF Timeline Data Adapter
 * RTF-F03: Timeline adapter - Data normalization layer
 * Provides utility functions and data transformations for RTF timeline
 */

import type { RtfTimeline, RtfTimelineEntry } from '@/lib/api/types'

/**
 * Get the current program week based on start date and timezone
 */
export function getCurrentProgramWeek(
  startDate: string,
  durationWeeks: number,
  timezone?: string
): number {
  const start = new Date(startDate)
  const now = new Date()
  
  // Convert to specified timezone if provided
  if (timezone) {
    // For now, assume UTC. In production, use proper timezone conversion
    // This would typically use libraries like date-fns-tz
  }
  
  const diffMs = now.getTime() - start.getTime()
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
  
  // Clamp to valid range
  return Math.max(1, Math.min(diffWeeks + 1, durationWeeks))
}

/**
 * Calculate timeline statistics
 */
export interface TimelineStats {
  totalWeeks: number
  trainingWeeks: number
  deloadWeeks: number
  currentWeek: number
  progress: number // 0-100
  completedWeeks: number
  remainingWeeks: number
}

export function calculateTimelineStats(
  timeline: RtfTimeline,
  currentWeek?: number
): TimelineStats {
  const totalWeeks = timeline.totalWeeks
  const deloadWeeks = timeline.timeline.filter(entry => entry.isDeload).length
  const trainingWeeks = totalWeeks - deloadWeeks
  const current = currentWeek || 1
  const completedWeeks = Math.max(0, current - 1)
  const remainingWeeks = Math.max(0, totalWeeks - current + 1)
  
  return {
    totalWeeks,
    trainingWeeks,
    deloadWeeks,
    currentWeek: current,
    progress: Math.round((current / totalWeeks) * 100),
    completedWeeks,
    remainingWeeks
  }
}

/**
 * Get timeline entries grouped by month for calendar view
 */
export interface TimelineMonth {
  month: string // "2025-09"
  monthLabel: string // "September 2025"
  weeks: RtfTimelineEntry[]
}

export function groupTimelineByMonth(timeline: RtfTimeline): TimelineMonth[] {
  const monthGroups = new Map<string, RtfTimelineEntry[]>()
  
  timeline.timeline.forEach(entry => {
    const date = new Date(entry.startDate)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthGroups.has(monthKey)) {
      monthGroups.set(monthKey, [])
    }
    monthGroups.get(monthKey)!.push(entry)
  })
  
  return Array.from(monthGroups.entries()).map(([monthKey, weeks]) => {
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    const monthLabel = date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })
    
    return {
      month: monthKey,
      monthLabel,
      weeks: weeks.sort((a, b) => a.week - b.week)
    }
  }).sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * Find the next deload week
 */
export function getNextDeloadWeek(
  timeline: RtfTimeline,
  currentWeek: number
): RtfTimelineEntry | null {
  return timeline.timeline
    .filter(entry => entry.isDeload && entry.week > currentWeek)
    .sort((a, b) => a.week - b.week)[0] || null
}

/**
 * Get timeline phase information (useful for different training phases)
 */
export interface TimelinePhase {
  phase: 'early' | 'mid' | 'late'
  phaseLabel: string
  weekRange: [number, number]
  description: string
}

export function getTimelinePhase(
  timeline: RtfTimeline,
  currentWeek: number
): TimelinePhase {
  const totalWeeks = timeline.totalWeeks
  const progress = currentWeek / totalWeeks
  
  if (progress <= 0.33) {
    return {
      phase: 'early',
      phaseLabel: 'Early Phase',
      weekRange: [1, Math.ceil(totalWeeks * 0.33)],
      description: 'Building base strength and technique'
    }
  } else if (progress <= 0.66) {
    return {
      phase: 'mid',
      phaseLabel: 'Mid Phase', 
      weekRange: [Math.ceil(totalWeeks * 0.33) + 1, Math.ceil(totalWeeks * 0.66)],
      description: 'Progressive overload and intensity'
    }
  } else {
    return {
      phase: 'late',
      phaseLabel: 'Late Phase',
      weekRange: [Math.ceil(totalWeeks * 0.66) + 1, totalWeeks],
      description: 'Peak performance and testing'
    }
  }
}

/**
 * Validate timeline data consistency
 */
export interface TimelineValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validateTimeline(timeline: RtfTimeline): TimelineValidation {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check basic structure
  if (!timeline.timeline || timeline.timeline.length === 0) {
    errors.push('Timeline is empty')
    return { isValid: false, errors, warnings }
  }
  
  // Check week sequence
  const weeks = timeline.timeline.map(entry => entry.week).sort((a, b) => a - b)
  for (let i = 0; i < weeks.length - 1; i++) {
    if (weeks[i + 1] - weeks[i] !== 1) {
      errors.push(`Missing week between ${weeks[i]} and ${weeks[i + 1]}`)
    }
  }
  
  // Check total weeks consistency
  if (timeline.totalWeeks !== timeline.timeline.length) {
    warnings.push(`Total weeks (${timeline.totalWeeks}) doesn't match timeline entries (${timeline.timeline.length})`)
  }
  
  // Check deload pattern (should be reasonable)
  const deloadWeeks = timeline.timeline.filter(entry => entry.isDeload)
  if (timeline.withDeloads && deloadWeeks.length === 0) {
    warnings.push('Timeline indicates deloads but no deload weeks found')
  }
  
  // Check date sequence
  const dates = timeline.timeline
    .map(entry => ({ week: entry.week, date: new Date(entry.startDate) }))
    .sort((a, b) => a.week - b.week)
    
  for (let i = 0; i < dates.length - 1; i++) {
    const current = dates[i]
    const next = dates[i + 1]
    const daysDiff = (next.date.getTime() - current.date.getTime()) / (24 * 60 * 60 * 1000)
    
    if (daysDiff !== 7) {
      warnings.push(`Week ${current.week} to ${next.week} span is ${daysDiff} days instead of 7`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}