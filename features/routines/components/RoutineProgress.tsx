import { Progress } from '@/components/ui/progress'

interface RoutineProgressProps {
  // Backwards-compatible flag for 0%/100%
  completed?: boolean
  // Optional explicit percentage (0..100). Takes precedence over 'completed'.
  value?: number
  // Left label (defaults to 'Completion')
  label?: string
  // Optional right text (e.g., "3/8 sets (37%)")
  rightText?: string
}

export function RoutineProgress({
  completed,
  value,
  label = 'Completion',
  rightText,
}: RoutineProgressProps) {
  const computed = (() => {
    if (typeof value === 'number') return Math.max(0, Math.min(100, value))
    return completed ? 100 : 0
  })()
  return (
    <div className="space-y-1 mb-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{rightText ?? `${computed}%`}</span>
      </div>
      <Progress variant="gold" value={computed} />
    </div>
  )
}
