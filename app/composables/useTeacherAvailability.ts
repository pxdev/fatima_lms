/**
 * Teacher Availability Composable
 * Handles teacher availability rules CRUD
 */

interface AvailabilityRule {
  id: string
  teacher: string
  weekday: number // 0 = Sunday, 6 = Saturday
  start_time: string // HH:mm format
  end_time: string // HH:mm format
  is_active: boolean
}

interface CreateAvailabilityPayload {
  teacher: string
  weekday: number
  start_time: string
  end_time: string
  is_active?: boolean
}

interface UpdateAvailabilityPayload {
  weekday?: number
  start_time?: string
  end_time?: string
  is_active?: boolean
}

const WEEKDAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

export function useTeacherAvailability() {
  const { getItems, createItems, updateItem, deleteItems } = useDirectusItems()

  const rules = ref<AvailabilityRule[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch availability rules for a teacher
   */
  async function fetchRules(teacherProfileId: string): Promise<AvailabilityRule[]> {
    isLoading.value = true
    error.value = null

    try {
      const data = await getItems<AvailabilityRule>({
        collection: 'teacher_availability_rules',
        params: {
          filter: {
            teacher: { _eq: teacherProfileId }
          },
          sort: ['weekday', 'start_time']
        }
      })

      rules.value = data || []
      return rules.value
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to fetch availability'
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new availability rule (via API with duplicate validation)
   */
  async function createRule(payload: CreateAvailabilityPayload): Promise<AvailabilityRule | null> {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data: AvailabilityRule }>('/api/availability', {
        method: 'POST',
        body: {
          teacher: payload.teacher,
          weekday: payload.weekday,
          start_time: payload.start_time,
          end_time: payload.end_time,
          is_active: payload.is_active ?? true
        }
      })

      if (response.success && response.data) {
        rules.value.push(response.data)
        return response.data
      }
      return null
    } catch (err: any) {
      error.value = err?.data?.statusMessage || err?.message || 'Failed to create rule'
      throw err // Re-throw to let the component handle it
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update an availability rule
   */
  async function updateRule(id: string, payload: UpdateAvailabilityPayload): Promise<AvailabilityRule | null> {
    isLoading.value = true
    error.value = null

    try {
      const data = await updateItem<AvailabilityRule>({
        collection: 'teacher_availability_rules',
        id,
        item: payload
      })

      if (data) {
        const index = rules.value.findIndex(r => r.id === id)
        if (index !== -1) {
          rules.value[index] = data
        }
      }
      return data || null
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to update rule'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete an availability rule
   */
  async function deleteRule(id: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      await deleteItems({
        collection: 'teacher_availability_rules',
        items: [id]
      })

      rules.value = rules.value.filter(r => r.id !== id)
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to delete rule'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get weekday label
   */
  function getWeekdayLabel(weekday: number): string {
    return WEEKDAYS.find(w => w.value === weekday)?.label || 'Unknown'
  }

  /**
   * Get active rules only
   */
  function getActiveRules(): AvailabilityRule[] {
    return rules.value.filter(r => r.is_active)
  }

  /**
   * Get available time slots for a specific date based on teacher availability
   */
  function getAvailableSlotsForDate(date: Date): { start_time: string; end_time: string }[] {
    const weekday = date.getDay() // 0 = Sunday, 6 = Saturday
    const activeRules = rules.value.filter(r => r.is_active && r.weekday === weekday)
    
    return activeRules.map(rule => ({
      start_time: rule.start_time,
      end_time: rule.end_time
    }))
  }

  /**
   * Check if a specific weekday has any availability
   */
  function hasAvailabilityOnWeekday(weekday: number): boolean {
    return rules.value.some(r => r.is_active && r.weekday === weekday)
  }

  /**
   * Get all weekdays with availability
   */
  function getAvailableWeekdays(): number[] {
    const activeRules = rules.value.filter(r => r.is_active)
    return [...new Set(activeRules.map(r => r.weekday))]
  }

  return {
    rules,
    isLoading,
    error,
    weekdays: WEEKDAYS,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    getWeekdayLabel,
    getActiveRules,
    getAvailableSlotsForDate,
    hasAvailabilityOnWeekday,
    getAvailableWeekdays
  }
}




