/**
 * Subscriptions Composable
 * Handles subscription CRUD operations
 */

type SubscriptionStatus = 
  | 'draft'
  | 'pending_payment'
  | 'payment_received'
  | 'teacher_assigned'
  | 'active'
  | 'completed'
  | 'cancelled'

export interface Subscription {
  id: string
  student: string
  teacher: string | null | { display_name: string }
  course: string | { id: string; label: string }
  package: string | { id: string; label: string }
  status: SubscriptionStatus
  weeks_total: number
  sessions_total: number
  sessions_remaining: number
  postpone_total: number
  postpone_remaining: number
  cycle_start_at: string | null
  cycle_end_at: string | null
  lemon_subscription_id: string | null
  admin_note: string | null
}

interface CreateSubscriptionPayload {
  student: string
  course: string
  package: string
  weeks_total: number
  sessions_total: number
  sessions_remaining: number
  postpone_total?: number
  postpone_remaining?: number
}

export function useSubscriptions() {
  const { getItems, getItemById, createItems, updateItem } = useDirectusItems()

  const subscriptions = ref<Subscription[]>([])
  const currentSubscription = ref<Subscription | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all subscriptions for the current student
   */
  async function fetchMySubscriptions(studentProfileId: string): Promise<Subscription[]> {
    isLoading.value = true
    error.value = null

    try {
      const data = await getItems<Subscription>({
        collection: 'subscriptions',
        params: {
          filter: {
            student: { _eq: studentProfileId }
          },
          fields: [
            'id',
            'student',
            'teacher',
            'teacher.display_name',
            'course.id',
            'course.label',
            'package.id',
            'package.label',
            'status',
            'weeks_total',
            'sessions_total',
            'sessions_remaining',
            'postpone_total',
            'postpone_remaining',
            'cycle_start_at',
            'cycle_end_at',
            'lemon_subscription_id',
            'admin_note'
          ],
          sort: ['-date_created']
        }
      })

      subscriptions.value = data || []
      return subscriptions.value
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to fetch subscriptions'
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch a single subscription by ID
   */
  async function fetchSubscription(id: string): Promise<Subscription | null> {
    isLoading.value = true
    error.value = null

    try {
      const data = await getItemById<Subscription>({
        collection: 'subscriptions',
        id,
        params: {
          fields: [
            'id',
            'student',
            'teacher', // This should return the teacher ID (string)
            'teacher.id', // Explicitly request ID in case relation is expanded
            'teacher.display_name', // For display purposes
            'course.id',
            'course.label',
            'package.id',
            'package.label',
            'status',
            'weeks_total',
            'sessions_total',
            'sessions_remaining',
            'postpone_total',
            'postpone_remaining',
            'cycle_start_at',
            'cycle_end_at',
            'lemon_subscription_id',
            'admin_note'
          ]
        }
      })

      currentSubscription.value = data || null
      return currentSubscription.value
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to fetch subscription'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new subscription (student)
   */
  async function createSubscription(payload: CreateSubscriptionPayload): Promise<Subscription | null> {
    isLoading.value = true
    error.value = null

    try {
      const data = await createItems<Subscription>({
        collection: 'subscriptions',
        items: [{
          ...payload,
          status: 'draft',
          postpone_total: payload.postpone_total ?? 2,
          postpone_remaining: payload.postpone_remaining ?? 2
        }]
      })

      if (data && data.length > 0 && data[0]) {
        currentSubscription.value = data[0]
        return data[0]
      }
      return null
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to create subscription'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update subscription (generic update function)
   */
  async function updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | null> {
    isLoading.value = true
    error.value = null

    try {
      const data = await updateItem<Subscription>({
        collection: 'subscriptions',
        id,
        item: updates
      })

      if (data) {
        // Update current subscription if it matches
        if (currentSubscription.value?.id === id) {
          currentSubscription.value = data
        }
        // Update in subscriptions list
        const index = subscriptions.value.findIndex(s => s.id === id)
        if (index !== -1) {
          subscriptions.value[index] = data
        }
      }
      return data || null
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to update subscription'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update subscription status
   */
  async function updateSubscriptionStatus(id: string, status: SubscriptionStatus): Promise<Subscription | null> {
    isLoading.value = true
    error.value = null

    try {
      const data = await updateItem<Subscription>({
        collection: 'subscriptions',
        id,
        item: { status }
      })

      if (data) {
        currentSubscription.value = data
      }
      return data || null
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to update subscription'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Assign teacher to subscription (admin only)
   */
  async function assignTeacher(id: string, teacherProfileId: string): Promise<Subscription | null> {
    isLoading.value = true
    error.value = null

    try {
      const data = await updateItem<Subscription>({
        collection: 'subscriptions',
        id,
        item: {
          teacher: teacherProfileId,
          status: 'teacher_assigned'
        }
      })

      return data || null
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to assign teacher'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get status badge color
   */
  type BadgeColor = 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'
  
  function getStatusColor(status: SubscriptionStatus): BadgeColor {
    const colors: Record<SubscriptionStatus, BadgeColor> = {
      draft: 'neutral',
      pending_payment: 'warning',
      payment_received: 'info',
      teacher_assigned: 'primary',
      active: 'success',
      completed: 'success',
      cancelled: 'error'
    }
    return colors[status] || 'neutral'
  }

  return {
    subscriptions,
    currentSubscription,
    isLoading,
    error,
    fetchMySubscriptions,
    fetchSubscription,
    createSubscription,
    updateSubscription,
    updateSubscriptionStatus,
    assignTeacher,
    getStatusColor
  }
}

