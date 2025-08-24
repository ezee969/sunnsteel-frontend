import { describe, it, expect } from 'vitest'
import { formatTime, parseTime, isValidTimeFormat, formatTimeReadable } from '@/lib/utils/time'

describe('time utils', () => {
  it('formatTime formats seconds into MM:SS', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(5)).toBe('0:05')
    expect(formatTime(65)).toBe('1:05')
    expect(formatTime(150)).toBe('2:30')
  })

  it('parseTime parses MM:SS into seconds', () => {
    expect(parseTime('0:00')).toBe(0)
    expect(parseTime('0:05')).toBe(5)
    expect(parseTime('1:05')).toBe(65)
    expect(parseTime('2:30')).toBe(150)
    expect(parseTime('bad')).toBe(0)
  })

  it('isValidTimeFormat validates MM:SS bounds', () => {
    expect(isValidTimeFormat('0:00')).toBe(true)
    expect(isValidTimeFormat('12:59')).toBe(true)
    expect(isValidTimeFormat('12:60')).toBe(false)
    expect(isValidTimeFormat('1:5')).toBe(false)
    expect(isValidTimeFormat('bad')).toBe(false)
  })

  it('formatTimeReadable turns seconds into human readable string', () => {
    expect(formatTimeReadable(0)).toBe('0 sec')
    expect(formatTimeReadable(59)).toBe('59 sec')
    expect(formatTimeReadable(60)).toBe('1 min')
    expect(formatTimeReadable(90)).toBe('1 min 30 sec')
  })
})
