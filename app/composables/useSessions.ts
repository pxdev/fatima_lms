/**
 * Sessions Composable
 * Handles session operations
 */

import { format, parseISO, differenceInMinutes } from 'date-fns'

type SessionStatus = 
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'student_no_show'
  | 'teacher_no_show'
  | 'student_requested_postpone'
  | 'postpone_approved'

interface Session {
  id: string
  subscription: string
  start_at: string
  end_at: string
  status: SessionStatus
  zoom_meeting_id: string | null
  zoom_join_url: string | null
  zoom_start_url: string | null
  postpone_reason: string | null
  postpone_requested_at: string | null
  postpone_approved_at: string | null
  rescheduled_from: string | null
  completed_at: string | null
}

interface UpdateSessionPayload {
  status?: SessionStatus
  postpone_reason?: string
}

export function useSessions() {
  const { getItems, getItemById, updateItem } = useDirectusItems()

  const sessions = ref<Session[]>([])
  const currentSession = ref<Session | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch sessions for a subscription
   */
  async function fetchSessions(subscriptionId: string): Promise<Session[]> {
    isLoading.value = true
    error.value = null

    try {
      const data = await getItems<Session>({
        collection: 'sessions',
        params: {
          filter: {
            subscription: { _eq: subscriptionId }
          },
          sort: ['start_at']
        }
      })

      sessions.value = data || []
      return sessions.value
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to fetch sessions'
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch upcoming sessions for a user (teacher or student)
   */
  async function fetchUpcomingSessions(profileId: string, role: 'student' | 'teacher'): Promise<Session[]> {
    isLoading.value = true
    error.value = null

    try {
      const filterField = role === 'teacher' ? 'subscription.teacher' : 'subscription.student'
      const now = new Date().toISOString() // Keep ISO string for API filter

      const data = await getItems<Session>({
        collection: 'sessions',
        params: {
          filter: {
            _and: [
              { [filterField]: { _eq: profileId } },
              { status: { _in: ['scheduled', 'in_progress'] } },
              { start_at: { _gte: now } }
            ]
          },
          sort: ['start_at'],
          limit: 10
        }
      })

      sessions.value = data || []
      return sessions.value
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to fetch sessions'
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch a single session
   */
  async function fetchSession(id: string): Promise<Session | null> {
    isLoading.value = true
    error.value = null

    try {
      const data = await getItemById<Session>({
        collection: 'sessions',
        id
      })

      currentSession.value = data || null
      return currentSession.value
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to fetch session'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Request postpone (student)
   */
  async function requestPostpone(sessionId: string, reason: string): Promise<Session | null> {
    isLoading.value = true
    error.value = null

    try {
      const data = await updateItem<Session>({
        collection: 'sessions',
        id: sessionId,
        item: {
          status: 'student_requested_postpone',
          postpone_reason: reason,
          postpone_requested_at: new Date().toISOString() // Keep ISO string for API
        }
      })

      if (data) {
        currentSession.value = data
        const index = sessions.value.findIndex(s => s.id === sessionId)
        if (index !== -1) {
          sessions.value[index] = data
        }
      }
      return data || null
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to request postpone'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get status badge color
   */
  function getStatusColor(status: SessionStatus): string {
    const colors: Record<SessionStatus, string> = {
      scheduled: 'info',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'error',
      student_no_show: 'error',
      teacher_no_show: 'error',
      student_requested_postpone: 'warning',
      postpone_approved: 'neutral'
    }
    return colors[status] || 'neutral'
  }

  /**
   * Format session time (respects global timezone toggle)
   */
  function formatSessionTime(session: Session): string {
    const { isToggled } = useTimezoneToggle()
    const { formatDate, formatTime } = useTimezone()
    const { formatDateRaw, formatTimeRaw } = useTimezone()
    
    const start = parseISO(session.start_at)
    const end = parseISO(session.end_at)
    
    if (isToggled.value) {
      // Use timezone-aware formatting
      const dateStr = formatDate(start, { weekday: 'long', month: 'long', day: 'numeric' })
      const startTime = formatTime(start)
      const endTime = formatTime(end)
      return `${dateStr}, ${startTime} - ${endTime}`
    } else {
      // Use raw formatting (as stored in Directus)
      const dateStr = formatDateRaw(start, { format: 'EEEE, MMMM d' })
      const startTime = formatTimeRaw(start, { format: 'h:mm a' })
      const endTime = formatTimeRaw(end, { format: 'h:mm a' })
      return `${dateStr}, ${startTime} - ${endTime}`
    }
  }

  /**
   * Check if session can be joined (within 15 min of start)
   */
  function canJoinSession(session: Session): boolean {
    if (!['scheduled', 'in_progress'].includes(session.status)) return false
    if (!session.zoom_join_url) return false
    
    const now = new Date()
    const start = parseISO(session.start_at)
    const diffMinutes = differenceInMinutes(start, now)
    
    // Can join 15 minutes before and until session ends
    return diffMinutes <= 15
  }

  /**
   * Join session (open Zoom URL)
   */
  function joinSession(session: Session) {
    if (session.zoom_join_url) {
      window.open(session.zoom_join_url, '_blank')
    }
  }

  return {
    sessions,
    currentSession,
    isLoading,
    error,
    fetchSessions,
    fetchUpcomingSessions,
    fetchSession,
    requestPostpone,
    getStatusColor,
    formatSessionTime,
    canJoinSession,
    joinSession
  }
}

