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

/**
 * Renders a labeled progress bar showing completion as a percentage.
 *
 * The displayed progress is determined by `value` when provided (clamped to 0–100). If `value` is not provided, `completed` controls progress (100 when `true`, 0 when `false`). The header shows `label` on the left and either `rightText` (if supplied) or the computed percentage on the right.
 *
 * @param completed - Legacy boolean indicating full completion (used when `value` is not provided).
 * @param value - Explicit progress percentage; takes precedence over `completed` and is clamped to the range 0–100.
 * @param label - Left-side label text (defaults to `"Completion"`).
 * @param rightText - Optional right-side text that overrides the computed percentage display.
 * @returns A React element containing the label, right-side text or percentage, and a gold-variant progress bar set to the computed value.
 */
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
