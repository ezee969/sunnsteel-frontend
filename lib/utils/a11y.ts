import type React from 'react'

// Helper to activate actions with Enter or Space keys consistently
export const onPressEnterOrSpace = (handler: () => void) => {
  return (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handler()
    }
  }
}
