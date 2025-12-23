/**
 * Timezone-aware Date Formatting Composable
 * Formats dates and times according to the user's profile timezone
 */

export function useTimezone() {
  const { profile } = useProfile()
  
  // Get user's timezone or default to Asia/Riyadh
  const userTimezone = computed(() => profile.value?.timezone || 'Asia/Riyadh')
  
  /**
   * Format a date string to locale date string in user's timezone
   */
  function formatDate(dateStr: string | Date, options?: Intl.DateTimeFormatOptions): string {
    if (!dateStr) return ''
    
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    
    return new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone.value,
      ...options
    }).format(date)
  }
  
  /**
   * Format a date string to locale time string in user's timezone
   */
  function formatTime(dateStr: string | Date, options?: Intl.DateTimeFormatOptions): string {
    if (!dateStr) return ''
    
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    
    return new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone.value,
      hour: 'numeric',
      minute: '2-digit',
      ...options
    }).format(date)
  }
  
  /**
   * Format a date string to locale date and time string in user's timezone
   */
  function formatDateTime(dateStr: string | Date, options?: Intl.DateTimeFormatOptions): string {
    if (!dateStr) return ''
    
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    
    return new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone.value,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      ...options
    }).format(date)
  }
  
  /**
   * Format slot time (start and end) for display
   */
  function formatSlotTime(startAt: string, endAt: string): string {
    if (!startAt || !endAt) return ''
    
    const start = new Date(startAt)
    const end = new Date(endAt)
    
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
    
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    
    return new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone.value,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    }).format(date)
  }
  
  /**
   * Get current date/time in user's timezone
   */
  function getNowInTimezone(): Date {
    // Create a date string in the user's timezone
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone.value,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    
    const parts = formatter.formatToParts(now)
    const year = parts.find(p => p.type === 'year')?.value
    const month = parts.find(p => p.type === 'month')?.value
    const day = parts.find(p => p.type === 'day')?.value
    const hour = parts.find(p => p.type === 'hour')?.value
    const minute = parts.find(p => p.type === 'minute')?.value
    const second = parts.find(p => p.type === 'second')?.value
    
    // Create date string in ISO format but interpreted as local time
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`)
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

