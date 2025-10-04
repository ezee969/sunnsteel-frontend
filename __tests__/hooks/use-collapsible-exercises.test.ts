import { renderHook, act } from '@testing-library/react'
import { useCollapsibleExercises } from '@/hooks/use-collapsible-exercises'

describe('useCollapsibleExercises', () => {
  const exerciseIds = ['exercise-1', 'exercise-2', 'exercise-3']

  it('should initialize with all exercises expanded', () => {
    const { result } = renderHook(() => useCollapsibleExercises())
    exerciseIds.forEach(id => {
      expect(result.current.isCollapsed(id)).toBe(false)
    })
  })

  it('should toggle exercise collapse state', () => {
    const { result } = renderHook(() => useCollapsibleExercises())

    // Initially expanded
    expect(result.current.isCollapsed('exercise-1')).toBe(false)

    // Toggle to collapsed
    act(() => {
      result.current.toggleExercise('exercise-1')
    })
    expect(result.current.isCollapsed('exercise-1')).toBe(true)

    // Toggle back to expanded
    act(() => {
      result.current.toggleExercise('exercise-1')
    })
    expect(result.current.isCollapsed('exercise-1')).toBe(false)
  })

  it('should collapse all exercises', () => {
    const { result } = renderHook(() => useCollapsibleExercises())

    // Initially all expanded
    exerciseIds.forEach(id => {
      expect(result.current.isCollapsed(id)).toBe(false)
    })

    // Collapse all
    act(() => {
      result.current.collapseAll(exerciseIds)
    })

    // All should be collapsed
    exerciseIds.forEach(id => {
      expect(result.current.isCollapsed(id)).toBe(true)
    })
  })

  it('should expand all exercises', () => {
    const { result } = renderHook(() => useCollapsibleExercises())

    // First collapse all
    act(() => {
      result.current.collapseAll(exerciseIds)
    })

    // Verify all collapsed
    exerciseIds.forEach(id => {
      expect(result.current.isCollapsed(id)).toBe(true)
    })

    // Expand all
    act(() => {
      result.current.expandAll()
    })

    // All should be expanded
    exerciseIds.forEach(id => {
      expect(result.current.isCollapsed(id)).toBe(false)
    })
  })

  it('should handle individual toggles after collapse all', () => {
    const { result } = renderHook(() => useCollapsibleExercises())

    // Collapse all
    act(() => {
      result.current.collapseAll(exerciseIds)
    })

    // Toggle one exercise
    act(() => {
      result.current.toggleExercise('exercise-2')
    })

    // Only exercise-2 should be expanded
    expect(result.current.isCollapsed('exercise-1')).toBe(true)
    expect(result.current.isCollapsed('exercise-2')).toBe(false)
    expect(result.current.isCollapsed('exercise-3')).toBe(true)
  })

  it('should handle individual toggles after expand all', () => {
    const { result } = renderHook(() => useCollapsibleExercises())

    // Collapse one exercise first
    act(() => {
      result.current.toggleExercise('exercise-2')
    })

    // Expand all
    act(() => {
      result.current.expandAll()
    })

    // All should be expanded
    exerciseIds.forEach(id => {
      expect(result.current.isCollapsed(id)).toBe(false)
    })

    // Toggle one exercise to collapsed
    act(() => {
      result.current.toggleExercise('exercise-1')
    })

    // Only exercise-1 should be collapsed
    expect(result.current.isCollapsed('exercise-1')).toBe(true)
    expect(result.current.isCollapsed('exercise-2')).toBe(false)
    expect(result.current.isCollapsed('exercise-3')).toBe(false)
  })

  it('should handle empty exercise list', () => {
    const { result } = renderHook(() => useCollapsibleExercises())

    // Should not throw errors
    expect(() => {
      result.current.collapseAll([])
      result.current.expandAll()
      result.current.toggleExercise('non-existent')
      result.current.isCollapsed('non-existent')
    }).not.toThrow()

    // Non-existent exercise should return false (expanded by default)
    expect(result.current.isCollapsed('non-existent')).toBe(false)
  })

  it('should handle non-existent exercise IDs gracefully', () => {
    const { result } = renderHook(() => useCollapsibleExercises())

    // Check non-existent exercise (should return false - expanded by default)
    expect(result.current.isCollapsed('non-existent')).toBe(false)

    // Toggle non-existent exercise (should not throw)
    expect(() => {
      act(() => {
        result.current.toggleExercise('non-existent')
      })
    }).not.toThrow()

    // After toggle, non-existent should be collapsed
    expect(result.current.isCollapsed('non-existent')).toBe(true)
  })

  it('should maintain state across multiple operations', () => {
    const { result } = renderHook(() => useCollapsibleExercises())

    // Complex sequence of operations
    act(() => {
      result.current.toggleExercise('exercise-1') // collapse
      result.current.toggleExercise('exercise-3') // collapse
    })

    expect(result.current.isCollapsed('exercise-1')).toBe(true)
    expect(result.current.isCollapsed('exercise-2')).toBe(false)
    expect(result.current.isCollapsed('exercise-3')).toBe(true)

    act(() => {
      result.current.collapseAll(exerciseIds)
    })

    // All should be collapsed
    exerciseIds.forEach(id => {
      expect(result.current.isCollapsed(id)).toBe(true)
    })

    act(() => {
      result.current.toggleExercise('exercise-2') // expand only exercise-2
    })

    expect(result.current.isCollapsed('exercise-1')).toBe(true)
    expect(result.current.isCollapsed('exercise-2')).toBe(false)
    expect(result.current.isCollapsed('exercise-3')).toBe(true)

    act(() => {
      result.current.expandAll()
    })

    // All should be expanded again
    exerciseIds.forEach(id => {
      expect(result.current.isCollapsed(id)).toBe(false)
    })
  })

  it('should handle dynamic exercise list changes', () => {
    const { result } = renderHook(() => useCollapsibleExercises())

    // Toggle first exercise
    act(() => {
      result.current.toggleExercise('exercise-1')
    })

    expect(result.current.isCollapsed('exercise-1')).toBe(true)
    expect(result.current.isCollapsed('exercise-2')).toBe(false)

    // Introduce a new exercise ID (not previously seen)
    // It should be expanded by default
    expect(result.current.isCollapsed('exercise-3')).toBe(false)

    // Remaining exercises maintain their state
    expect(result.current.isCollapsed('exercise-2')).toBe(false)
    expect(result.current.isCollapsed('exercise-3')).toBe(false)
    // Removed exercise state still accessible (not relevant but should persist)
    expect(result.current.isCollapsed('exercise-1')).toBe(true)
  })
})
