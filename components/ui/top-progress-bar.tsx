"use client";

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface TopProgressBarProps {
  active: boolean
  className?: string
}

export function TopProgressBar({ active, className }: TopProgressBarProps) {
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    // Clear timers helper
    const clearTimers = () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    if (active) {
      // Start/continue indeterminate progress towards ~90%
      clearTimers()
      setProgress((p) => (p === 0 ? 10 : p))
      intervalRef.current = window.setInterval(() => {
        setProgress((p) => {
          if (p < 90) return Math.min(90, p + Math.max(1, (90 - p) * 0.15))
          return p
        })
      }, 150)
    } else {
      // Complete and hide
      setProgress((p) => (p > 0 ? 100 : 0))
      clearTimers()
      if (progress > 0) {
        timeoutRef.current = window.setTimeout(() => {
          setProgress(0)
        }, 250)
      }
    }

    return () => clearTimers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const isVisible = progress > 0

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5',
        isVisible ? 'opacity-100' : 'opacity-0',
        'transition-opacity duration-200',
        className
      )}
      aria-hidden
    >
      <div className="relative h-full w-full bg-transparent">
        <div
          className="absolute left-0 top-0 h-full rounded-r"
          style={{
            width: `${progress}%`,
            background:
              'linear-gradient(90deg, rgba(255,215,0,0.6) 0%, rgba(255,215,0,0.8) 50%, rgba(255,215,0,0.6) 100%)',
            boxShadow: '0 0 8px rgba(255, 215, 0, 0.5)',
            transition: 'width 200ms ease-out',
          }}
        />
      </div>
    </div>
  )
}
