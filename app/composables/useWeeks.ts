/**
 * Subscription Weeks Composable
 * Handles week CRUD and submission
 */

// Note: toISOString() is kept for API compatibility

type WeekStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

interface SubscriptionWeek {
  id: string
  subscription: string
  week_index: number
  status: WeekStatus
  submitted_at: string | null
  reviewed_at: string | null
  teacher_comment: string | null
}

interface CreateWeekPayload {
  subscription: string
  week_index: number
}

export function useWeeks() {
  const { getItems, createItems, updateItem } = useDirectusItems()

  const weeks = ref<SubscriptionWeek[]>([])
  const currentWeek = ref<SubscriptionWeek | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch weeks for a subscription
   */
  async function fetchWeeks(subscriptionId: string): Promise<SubscriptionWeek[]> {
    isLoading.value = true
    error.value = null

    try {
      const data = await getItems<SubscriptionWeek>({
        collection: 'subscription_weeks',
        params: {
          filter: {
            subscription: { _eq: subscriptionId }
          },
          sort: ['week_index']
        }
      })

      weeks.value = data || []
      return weeks.value
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to fetch weeks'
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new week
   */
  async function createWeek(payload: CreateWeekPayload): Promise<SubscriptionWeek | null> {
    isLoading.value = true
    error.value = null

    try {
      const data = await createItems<SubscriptionWeek>({
        collection: 'subscription_weeks',
        items: [{
          ...payload,
          status: 'draft'
        }]
      })

      if (data && data.length > 0) {
        const week = data[0]
        weeks.value.push(week)
        currentWeek.value = week
        return week
      }
      return null
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to create week'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Submit a week for approval
   */
  async function submitWeek(weekId: string): Promise<SubscriptionWeek | null> {
    isLoading.value = true
    error.value = null

    try {
      const data = await updateItem<SubscriptionWeek>({
        collection: 'subscription_weeks',
        id: weekId,
        item: {
          status: 'submitted',
          submitted_at: new Date().toISOString()
        }
      })

      if (data) {
        const index = weeks.value.findIndex(w => w.id === weekId)
        if (index !== -1) {
          weeks.value[index] = data
        }
        currentWeek.value = data
      }
      return data || null
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to submit week'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get status badge color
   */
  function getStatusColor(status: WeekStatus): string {
    const colors: Record<WeekStatus, string> = {
      draft: 'neutral',
      submitted: 'warning',
      approved: 'success',
      rejected: 'error'
    }
    return colors[status] || 'neutral'
  }

  /**
   * Get current or create new week
   */
  async function getOrCreateWeek(subscriptionId: string, weekIndex: number): Promise<SubscriptionWeek | null> {
    await fetchWeeks(subscriptionId)
    
    let week = weeks.value.find(w => w.week_index === weekIndex)
    if (!week) {
      week = await createWeek({ subscription: subscriptionId, week_index: weekIndex })
    }
    
    currentWeek.value = week || null
    return week || null
  }

  return {
    weeks,
    currentWeek,
    isLoading,
    error,
    fetchWeeks,
    createWeek,
    submitWeek,
    getStatusColor,
    getOrCreateWeek
  }
}

