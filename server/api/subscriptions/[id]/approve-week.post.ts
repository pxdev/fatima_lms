/**
 * Approve Week Server Route
 * Creates sessions with Zoom meetings when teacher approves a week
 */

import { createZoomMeeting } from '~~/server/utils/zoom'

interface WeekSlot {
  id: string
  week: string
  start_at: string
  end_at: string
  note: string | null
}

interface SubscriptionWeek {
  id: string
  subscription: string
  week_index: number
  status: string
}

interface Subscription {
  id: string
  student: string
  teacher: string
  course: {
    id: string
    label: string
  }
  package: {
    id: string
    session_duration_min: number
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const subscriptionId = getRouterParam(event, 'id')
  const body = await readBody<{ week_id: string }>(event)

  if (!subscriptionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Subscription ID required'
    })
  }

  if (!body.week_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Week ID required'
    })
  }

  if (!config.directusAdminToken) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration error: Directus admin token missing'
    })
  }

  if (!config.public.directus.url) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration error: Directus URL missing'
    })
  }

  const directusUrl = config.public.directus.url
  const adminToken = config.directusAdminToken

  try {
    // Fetch the subscription with related data
    const subResponse = await $fetch<{ data: Subscription }>(`${directusUrl}/items/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      params: {
        fields: ['id', 'student', 'teacher', 'course.id', 'course.label', 'package.id', 'package.session_duration_min']
      }
    })
    const subscription = subResponse.data

    if (!subscription) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Subscription not found'
      })
    }

    // Fetch the week
    const weekResponse = await $fetch<{ data: SubscriptionWeek }>(`${directusUrl}/items/subscription_weeks/${body.week_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    })
    const week = weekResponse.data

    if (!week || week.subscription !== subscriptionId) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Week not found or does not belong to this subscription'
      })
    }

    if (week.status !== 'submitted') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Week must be in submitted status to approve'
      })
    }

    // Fetch slots for the week
    // Directus API requires filter to be JSON stringified in query params
    const filter = JSON.stringify({ week: { _eq: body.week_id } })
    
    const slotsResponse = await $fetch<{ data: WeekSlot[] }>(`${directusUrl}/items/week_slots`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      params: {
        filter,
        sort: ['start_at']
      }
    })
    const slots = slotsResponse.data || []

    if (slots.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No slots found for this week'
      })
    }

    const sessionsCreated: any[] = []
    const courseName = subscription.course?.label || 'Session'
    const sessionDuration = subscription.package?.session_duration_min || 60

    // Create sessions for each slot
    for (const slot of slots) {
      let zoomMeetingId: string | null = null
      let zoomJoinUrl: string | null = null
      let zoomStartUrl: string | null = null

      // Try to create Zoom meeting (optional - gracefully handle if Zoom not configured)
      try {
        const zoomMeeting = await createZoomMeeting({
          topic: `${courseName} - Session`,
          start_time: slot.start_at,
          duration: sessionDuration
        })

        zoomMeetingId = String(zoomMeeting.id)
        zoomJoinUrl = zoomMeeting.join_url
        zoomStartUrl = zoomMeeting.start_url
      } catch (zoomError: any) {
        console.warn('[Approve Week] Zoom meeting creation failed:', zoomError.message)
        // Continue without Zoom - meetings can be added later
      }

      // Create session record
      const sessionResponse = await $fetch<{ data: any }>(`${directusUrl}/items/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: {
          subscription: subscriptionId,
          start_at: slot.start_at,
          end_at: slot.end_at,
          status: 'scheduled',
          zoom_meeting_id: zoomMeetingId,
          zoom_join_url: zoomJoinUrl,
          zoom_start_url: zoomStartUrl
        }
      })
      const session = sessionResponse.data
      sessionsCreated.push(session)
    }

    // Update week status to approved
    await $fetch(`${directusUrl}/items/subscription_weeks/${body.week_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        status: 'approved',
        reviewed_at: new Date().toISOString()
      }
    })

    // Update subscription status to active (if not already)
    await $fetch(`${directusUrl}/items/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        status: 'active'
      }
    })

    return {
      success: true,
      status: 'active',
      sessions_created: sessionsCreated.length,
      sessions: sessionsCreated.map(s => ({
        id: s.id,
        start_at: s.start_at,
        zoom_join_url: s.zoom_join_url
      }))
    }
  } catch (err: any) {
    console.error('[Approve Week] Error:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to approve week'
    })
  }
})

