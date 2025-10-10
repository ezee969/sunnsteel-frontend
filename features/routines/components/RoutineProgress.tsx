import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface RoutineProgressProps {
  // Backwards-compatible flag for 0%/100%
  completed?: boolean
  // Optional explicit percentage (0..100). Takes precedence over 'completed'.
  value?: number
  // Left label (defaults to 'Completion')
  label?: string
  // Optional right text (e.g., "3/8 sets (37%)")
  rightText?: string
  // Compact variant for constrained spaces
  compact?: boolean
  // Optional wrapper className override
  className?: string
}

export function RoutineProgress({
  completed,
  value,
  label = 'Completion',
  rightText,
  compact = false,
  className,
}: RoutineProgressProps) {
  const computed = (() => {
    if (typeof value === 'number') return Math.max(0, Math.min(100, value))
    return completed ? 100 : 0
  })()
  return (
    <div
      className={cn(
        'space-y-1',
        compact ? 'mb-0' : 'mb-3',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between text-xs text-muted-foreground',
          compact && 'text-[11px] font-medium tracking-tight',
        )}
      >
        <span>{label}</span>
        <span>{rightText ?? `${computed}%`}</span>
      </div>
      <Progress
        variant="gold"
        value={computed}
        className={compact ? 'h-1.5' : undefined}
      />
    </div>
  )
}
