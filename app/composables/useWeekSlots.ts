/**
 * Week Slots Composable
 * Handles slot CRUD for scheduling
 */

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
   * Format slot time for display
   */
  function formatSlotTime(slot: WeekSlot): string {
    const start = new Date(slot.start_at)
    const end = new Date(slot.end_at)
    
    const dateStr = start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
    
    const startTime = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
    
    const endTime = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
    
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

