/**
 * Timezone-aware Date Formatting Composable
 * Formats dates and times according to the user's profile timezone
 */

import { format, parseISO } from 'date-fns'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'

// Unified format patterns - configure all date/time formats in one place
const DATE_FORMAT = 'MMM d, yyyy' // e.g., "Dec 28, 2024"
const DATE_FORMAT_LONG = 'EEEE, MMMM d, yyyy' // e.g., "Friday, December 28, 2024"
const DATE_FORMAT_SHORT = 'EEE, MMM d' // e.g., "Fri, Dec 28"
const TIME_FORMAT = 'h:mm a' // e.g., "9:00 AM"
const TIME_FORMAT_24H = 'HH:mm' // e.g., "09:00"
const DATETIME_FORMAT = 'EEE, MMM d, h:mm a' // e.g., "Fri, Dec 28, 9:00 AM"
const DATETIME_FORMAT_LONG = 'EEEE, MMMM d, yyyy h:mm a' // e.g., "Friday, December 28, 2024 9:00 AM"

export function useTimezone() {
  const { profile } = useProfile()
  
  // Get user's timezone or default to Asia/Riyadh
  const userTimezone = computed(() => profile.value?.timezone || 'Asia/Riyadh')
  
  // Export format constants for use in components
  const formats = {
    date: DATE_FORMAT,
    dateLong: DATE_FORMAT_LONG,
    dateShort: DATE_FORMAT_SHORT,
    time: TIME_FORMAT,
    time24h: TIME_FORMAT_24H,
    datetime: DATETIME_FORMAT,
    datetimeLong: DATETIME_FORMAT_LONG
  }
  
  /**
   * Format a date string to locale date string in user's timezone
   */
  function formatDate(dateStr: string | Date, options?: Intl.DateTimeFormatOptions): string {
    if (!dateStr) return ''
    
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    
    // Use unified format constants, with option overrides
    let formatPattern = DATE_FORMAT // Default
    
    if (options) {
      if (options.weekday) {
        formatPattern = options.weekday === 'long' ? DATE_FORMAT_LONG : DATE_FORMAT_SHORT
      } else if (options.month === 'long') {
        formatPattern = DATE_FORMAT_LONG
      } else if (options.month === 'short') {
        formatPattern = DATE_FORMAT
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
    
    // Use unified format constants
    const formatPattern = options?.hour12 === false ? TIME_FORMAT_24H : TIME_FORMAT
    
    return formatInTimeZone(date, userTimezone.value, formatPattern)
  }
  
  /**
   * Format a date string to locale date and time string in user's timezone
   */
  function formatDateTime(dateStr: string | Date, options?: Intl.DateTimeFormatOptions): string {
    if (!dateStr) return ''
    
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    
    // Use unified format constants
    const formatPattern = options?.hour12 === false 
      ? DATETIME_FORMAT.replace('h:mm a', 'HH:mm')
      : DATETIME_FORMAT
    
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
    
    // Use unified format constants
    let formatPattern = DATE_FORMAT_LONG // Default: long month format
    
    if (options) {
      if (options.month === 'short') {
        formatPattern = DATE_FORMAT
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

  /**
   * Global timezone conversion function
   * Converts server date/time to user's timezone for display only (does not modify server data)
   * 
   * @param dateStr - Server date/time string (e.g., "2025-12-24T18:23:00Z" or Date object)
   * @param targetTimezone - Target timezone (defaults to user's profile timezone)
   * @param type - Display type: 'date', 'time', or 'datetime'
   * @param options - Formatting options (optional)
   * @returns Formatted string in target timezone
   * 
   * @example
   * timeZoneDate('2025-12-24T18:23:00Z', 'America/New_York', 'datetime')
   * // Returns: "Wed, Dec 24, 1:23 PM" (converted to New York timezone)
   * 
   * timeZoneDate('2025-12-24T18:23:00Z', 'Asia/Riyadh', 'date')
   * // Returns: "Dec 24, 2025" (converted to Riyadh timezone)
   */
  function timeZoneDate(
    dateStr: string | Date | null,
    targetTimezone?: string,
    type: 'date' | 'time' | 'datetime' = 'datetime',
    options?: Intl.DateTimeFormatOptions
  ): string {
    if (!dateStr) return ''
    
    // Use provided timezone or fall back to user's timezone
    const tz = targetTimezone || userTimezone.value
    
    // Parse the date
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    
    // Determine format pattern based on type
    let formatPattern: string
    
    switch (type) {
      case 'date':
        // Determine date format based on options
        if (options?.weekday === 'long') {
          formatPattern = DATE_FORMAT_LONG
        } else if (options?.weekday === 'short') {
          formatPattern = DATE_FORMAT_SHORT
        } else if (options?.month === 'long') {
          formatPattern = DATE_FORMAT_LONG
        } else {
          formatPattern = DATE_FORMAT
        }
        break
        
      case 'time':
        // Determine time format based on options
        formatPattern = options?.hour12 === false ? TIME_FORMAT_24H : TIME_FORMAT
        break
        
      case 'datetime':
      default:
        // Determine datetime format based on options
        if (options?.hour12 === false) {
          formatPattern = DATETIME_FORMAT.replace('h:mm a', 'HH:mm')
        } else {
          formatPattern = DATETIME_FORMAT
        }
        break
    }
    
    // Convert and format in target timezone
    return formatInTimeZone(date, tz, formatPattern)
  }

  // ========== Raw Formatting Functions (No Timezone Conversion) ==========
  
  /**
   * Format date as stored in Directus (UTC) - no timezone conversion
   */
  function formatDateRaw(dateStr: string | Date, options?: { format?: string }): string {
    if (!dateStr) return ''
    
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    
    // Use UTC components to avoid timezone conversion
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth()
    const day = date.getUTCDate()
    
    const formatPattern = options?.format || DATE_FORMAT
    const dateObj = new Date(Date.UTC(year, month, day))
    return format(dateObj, formatPattern)
  }
  
  /**
   * Format time as stored in Directus (UTC) - no timezone conversion
   */
  function formatTimeRaw(dateStr: string | Date, options?: { format?: string; hour12?: boolean }): string {
    if (!dateStr) return ''
    
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    
    // Use UTC components to avoid timezone conversion
    const hours = date.getUTCHours()
    const minutes = date.getUTCMinutes()
    
    const formatPattern = options?.hour12 === false 
      ? (options?.format || TIME_FORMAT_24H)
      : (options?.format || TIME_FORMAT)
    
    const timeObj = new Date(Date.UTC(2000, 0, 1, hours, minutes))
    return format(timeObj, formatPattern)
  }
  
  /**
   * Format date and time as stored in Directus (UTC) - no timezone conversion
   */
  function formatDateTimeRaw(dateStr: string | Date, options?: { format?: string; hour12?: boolean }): string {
    if (!dateStr) return ''
    
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    
    // Use UTC components to avoid timezone conversion
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth()
    const day = date.getUTCDate()
    const hours = date.getUTCHours()
    const minutes = date.getUTCMinutes()
    
    const formatPattern = options?.format || DATETIME_FORMAT
    const dateTimeObj = new Date(Date.UTC(year, month, day, hours, minutes))
    return format(dateTimeObj, formatPattern)
  }
  
  /**
   * Format slot time (start and end) as stored in Directus (UTC) - no timezone conversion
   * Returns object with date and time for two-line display
   */
  function formatSlotTimeRaw(slot: { start_at: string; end_at: string }): { date: string; time: string } {
    if (!slot.start_at || !slot.end_at) return { date: '', time: '' }
    
    const startDate = parseISO(slot.start_at)
    const endDate = parseISO(slot.end_at)
    
    // Use UTC components
    const year = startDate.getUTCFullYear()
    const month = startDate.getUTCMonth()
    const day = startDate.getUTCDate()
    const startHours = startDate.getUTCHours()
    const startMinutes = startDate.getUTCMinutes()
    const endHours = endDate.getUTCHours()
    const endMinutes = endDate.getUTCMinutes()
    
    // Format date
    const dateObj = new Date(Date.UTC(year, month, day))
    const dateStr = format(dateObj, DATE_FORMAT_SHORT)
    
    // Format times
    const startPeriod = startHours >= 12 ? 'PM' : 'AM'
    const startDisplayHours = startHours % 12 || 12
    const startTime = `${startDisplayHours}:${String(startMinutes).padStart(2, '0')} ${startPeriod}`
    
    const endPeriod = endHours >= 12 ? 'PM' : 'AM'
    const endDisplayHours = endHours % 12 || 12
    const endTime = `${endDisplayHours}:${String(endMinutes).padStart(2, '0')} ${endPeriod}`
    
    return {
      date: dateStr,
      time: `${startTime} - ${endTime}`
    }
  }
  
  return {
    userTimezone,
    formats, // Export format constants
    formatDate,
    formatTime,
    formatDateTime,
    formatSlotTime,
    formatDateOnly,
    getNowInTimezone,
    // Global timezone conversion function
    timeZoneDate,
    // Raw formatting functions
    formatDateRaw,
    formatTimeRaw,
    formatDateTimeRaw,
    formatSlotTimeRaw
  }
}

