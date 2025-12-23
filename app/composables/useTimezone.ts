/**
 * Timezone-aware Date Formatting Composable
 * Formats dates and times according to the user's profile timezone
 */

import { format, parseISO } from 'date-fns'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'

export function useTimezone() {
  const { profile } = useProfile()
  
  // Get user's timezone or default to Asia/Riyadh
  const userTimezone = computed(() => profile.value?.timezone || 'Asia/Riyadh')
  
  /**
   * Format a date string to locale date string in user's timezone
   */
  function formatDate(dateStr: string | Date, options?: Intl.DateTimeFormatOptions): string {
    if (!dateStr) return ''
    
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    
    // Use date-fns-tz for timezone-aware formatting
    // Map Intl options to date-fns format patterns
    let formatPattern = 'PP' // Default: MMM d, yyyy
    
    if (options) {
      if (options.weekday) {
        formatPattern = options.weekday === 'long' ? 'EEEE, MMMM d, yyyy' : 'EEE, MMM d, yyyy'
      } else if (options.month === 'long') {
        formatPattern = 'MMMM d, yyyy'
      } else if (options.month === 'short') {
        formatPattern = 'MMM d, yyyy'
      }
    }
    
    return formatInTimeZone(date, userTimezone.value, formatPattern)
  }
  
  /**
   * Format a date string to locale time string in user's timezone
   */
  function formatTime(dateStr: string | Date, options?: Intl.DateTimeFormatOptions): string {
    if (!dateStr) return ''
    
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    
    // Use date-fns-tz for timezone-aware time formatting
    const formatPattern = options?.hour12 === false ? 'HH:mm' : 'h:mm a'
    
    return formatInTimeZone(date, userTimezone.value, formatPattern)
  }
  
  /**
   * Format a date string to locale date and time string in user's timezone
   */
  function formatDateTime(dateStr: string | Date, options?: Intl.DateTimeFormatOptions): string {
    if (!dateStr) return ''
    
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    
    // Use date-fns-tz for timezone-aware date-time formatting
    const formatPattern = options?.hour12 === false 
      ? 'EEE, MMM d, HH:mm' 
      : 'EEE, MMM d, h:mm a'
    
    return formatInTimeZone(date, userTimezone.value, formatPattern)
  }
  
  /**
   * Format slot time (start and end) for display
   */
  function formatSlotTime(startAt: string, endAt: string): string {
    if (!startAt || !endAt) return ''
    
    const start = parseISO(startAt)
    const end = parseISO(endAt)
    
    const dateStr = formatDate(start, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
    
    const startTime = formatTime(start)
    const endTime = formatTime(end)
    
    return `${dateStr}, ${startTime} - ${endTime}`
  }
  
  /**
   * Format date only (no time)
   */
  function formatDateOnly(dateStr: string | Date, options?: Intl.DateTimeFormatOptions): string {
    if (!dateStr) return ''
    
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    
    // Use date-fns-tz for timezone-aware date formatting
    let formatPattern = 'MMMM d, yyyy' // Default: long month format
    
    if (options) {
      if (options.month === 'short') {
        formatPattern = 'MMM d, yyyy'
      } else if (options.month === 'numeric') {
        formatPattern = 'M/d/yyyy'
      }
    }
    
    return formatInTimeZone(date, userTimezone.value, formatPattern)
  }
  
  /**
   * Get current date/time in user's timezone
   */
  function getNowInTimezone(): Date {
    // Use date-fns-tz to get current time in user's timezone
    const now = new Date()
    // Convert UTC time to user's timezone
    return toZonedTime(now, userTimezone.value)
  }
  
  return {
    userTimezone,
    formatDate,
    formatTime,
    formatDateTime,
    formatSlotTime,
    formatDateOnly,
    getNowInTimezone
  }
}

