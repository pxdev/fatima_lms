/**
 * Week Slots Composable
 * Handles slot CRUD for scheduling
 */

import { format, parseISO } from 'date-fns'

interface WeekSlot {
  id: string
  week: string
  start_at: string
  end_at: string
  note: string | null
}

interface CreateSlotPayload {
  week: string
  start_at: string
  end_at: string
  note?: string | null
}

interface UpdateSlotPayload {
  start_at?: string
  end_at?: string
  note?: string | null
}

export function useWeekSlots() {
  const { getItems, createItems, updateItem, deleteItems } = useDirectusItems()

  const slots = ref<WeekSlot[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch slots for a week
   */
  async function fetchSlots(weekId: string): Promise<WeekSlot[]> {
    isLoading.value = true
    error.value = null

    try {
      const data = await getItems<WeekSlot>({
        collection: 'week_slots',
        params: {
          filter: {
            week: { _eq: weekId }
          },
          sort: ['start_at']
        }
      })

      slots.value = data || []
      return slots.value
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to fetch slots'
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new slot
   */
  async function createSlot(payload: CreateSlotPayload): Promise<WeekSlot | null> {
    isLoading.value = true
    error.value = null

    try {
      const data = await createItems<WeekSlot>({
        collection: 'week_slots',
        items: [{
          week: payload.week,
          start_at: payload.start_at,
          end_at: payload.end_at,
          note: payload.note || null
        }]
      })

      if (data && data.length > 0) {
        slots.value.push(data[0])
        return data[0]
      }
      return null
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to create slot'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update a slot
   */
  async function updateSlot(id: string, payload: UpdateSlotPayload): Promise<WeekSlot | null> {
    isLoading.value = true
    error.value = null

    try {
      const data = await updateItem<WeekSlot>({
        collection: 'week_slots',
        id,
        item: payload
      })

      if (data) {
        const index = slots.value.findIndex(s => s.id === id)
        if (index !== -1) {
          slots.value[index] = data
        }
      }
      return data || null
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to update slot'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete a slot
   */
  async function deleteSlot(id: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      await deleteItems({
        collection: 'week_slots',
        items: [id]
      })

      slots.value = slots.value.filter(s => s.id !== id)
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to delete slot'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Format slot time for display (no timezone conversion - shows exactly as stored)
   * Parse the ISO string directly to avoid any timezone conversion
   */
  function formatSlotTime(slot: WeekSlot): string {
    // Parse ISO string directly: "2024-12-28T21:00:00Z" or "2024-12-28T21:00:00.000Z"
    // Extract components directly from the string to avoid Date object timezone issues
    const startMatch = slot.start_at.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
    const endMatch = slot.end_at.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
    
    if (!startMatch || !endMatch) {
      // Fallback to Date parsing if format is unexpected
      // parseISO returns a native Date object, so we can use native UTC methods
      const startDate = parseISO(slot.start_at)
      const endDate = parseISO(slot.end_at)
      const startHours = startDate.getUTCHours()
      const startMinutes = startDate.getUTCMinutes()
      const endHours = endDate.getUTCHours()
      const endMinutes = endDate.getUTCMinutes()
      const year = startDate.getUTCFullYear()
      const month = startDate.getUTCMonth()
      const day = startDate.getUTCDate()
      
      const date = new Date(Date.UTC(year, month, day))
      const dateStr = format(date, 'EEE, MMM d')
      
      const startPeriod = startHours >= 12 ? 'PM' : 'AM'
      const startDisplayHours = startHours % 12 || 12
      const startTime = `${startDisplayHours}:${String(startMinutes).padStart(2, '0')} ${startPeriod}`
      
      const endPeriod = endHours >= 12 ? 'PM' : 'AM'
      const endDisplayHours = endHours % 12 || 12
      const endTime = `${endDisplayHours}:${String(endMinutes).padStart(2, '0')} ${endPeriod}`
      
      return `${dateStr}, ${startTime} - ${endTime}`
    }
    
    // Extract components directly from string
    const [, startYear, startMonth, startDay, startHoursStr, startMinutesStr] = startMatch
    const [, , , , endHoursStr, endMinutesStr] = endMatch
    
    const startHours = parseInt(startHoursStr, 10)
    const startMinutes = parseInt(startMinutesStr, 10)
    const endHours = parseInt(endHoursStr, 10)
    const endMinutes = parseInt(endMinutesStr, 10)
    
    // Format date using the extracted components
    const date = new Date(parseInt(startYear, 10), parseInt(startMonth, 10) - 1, parseInt(startDay, 10))
    const dateStr = format(date, 'EEE, MMM d')
    
    // Format times using the extracted hours/minutes directly
    const startPeriod = startHours >= 12 ? 'PM' : 'AM'
    const startDisplayHours = startHours % 12 || 12
    const startTime = `${startDisplayHours}:${String(startMinutes).padStart(2, '0')} ${startPeriod}`
    
    const endPeriod = endHours >= 12 ? 'PM' : 'AM'
    const endDisplayHours = endHours % 12 || 12
    const endTime = `${endDisplayHours}:${String(endMinutes).padStart(2, '0')} ${endPeriod}`
    
    return `${dateStr}, ${startTime} - ${endTime}`
  }

  return {
    slots,
    isLoading,
    error,
    fetchSlots,
    createSlot,
    updateSlot,
    deleteSlot,
    formatSlotTime
  }
}

