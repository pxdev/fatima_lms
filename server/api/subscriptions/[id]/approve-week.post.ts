/**
 * Approve Week Server Route
 * Creates sessions with Zoom meetings when teacher approves a week
 */

import { createDirectus, rest, authentication, readItems, readItem, updateItem, createItem } from '@directus/sdk'
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

  // Initialize Directus client with admin token
  const directus = createDirectus(config.public.directus.url)
    .with(authentication())
    .with(rest())

  if (!config.directusAdminToken) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration error: Directus admin token missing'
    })
  }

  await directus.setToken(config.directusAdminToken)

  try {
    // Fetch the subscription with related data
    const subscription = await directus.request(
      readItem('subscriptions', subscriptionId, {
        fields: ['id', 'student', 'teacher', 'course.id', 'course.label', 'package.id', 'package.session_duration_min']
      })
    ) as Subscription

    if (!subscription) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Subscription not found'
      })
    }

    // Fetch the week
    const week = await directus.request(
      readItem('subscription_weeks', body.week_id)
    ) as SubscriptionWeek

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
    const slots = await directus.request(
      readItems('week_slots', {
        filter: { week: { _eq: body.week_id } },
        sort: ['start_at']
      })
    ) as WeekSlot[]

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
      const session = await directus.request(
        createItem('sessions', {
          subscription: subscriptionId,
          start_at: slot.start_at,
          end_at: slot.end_at,
          status: 'scheduled',
          zoom_meeting_id: zoomMeetingId,
          zoom_join_url: zoomJoinUrl,
          zoom_start_url: zoomStartUrl
        })
      )

      sessionsCreated.push(session)
    }

    // Update week status to approved
    await directus.request(
      updateItem('subscription_weeks', body.week_id, {
        status: 'approved',
        reviewed_at: new Date().toISOString()
      })
    )

    // Update subscription status to active (if not already)
    await directus.request(
      updateItem('subscriptions', subscriptionId, {
        status: 'active'
      })
    )

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

