/**
 * Approve Postpone Server Route
 * Approves a postpone request and decrements postpone counter
 */

import { createDirectus, rest, authentication, readItem, updateItem } from '@directus/sdk'

interface Session {
  id: string
  subscription: string
  status: string
  postpone_reason: string | null
}

interface Subscription {
  id: string
  postpone_remaining: number
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const sessionId = getRouterParam(event, 'id')

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Session ID required'
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
    // Fetch the session
    const session = await directus.request(
      readItem('sessions', sessionId)
    ) as Session

    if (!session) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Session not found'
      })
    }

    if (session.status !== 'student_requested_postpone') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session must be in postpone requested status'
      })
    }

    // Fetch the subscription
    const subscription = await directus.request(
      readItem('subscriptions', session.subscription)
    ) as Subscription

    if (!subscription) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Subscription not found'
      })
    }

    if (subscription.postpone_remaining <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No postpone credits remaining'
      })
    }

    // Update session status
    await directus.request(
      updateItem('sessions', sessionId, {
        status: 'postpone_approved',
        postpone_approved_at: new Date().toISOString()
      })
    )

    // Decrement postpone_remaining
    const newPostponeRemaining = subscription.postpone_remaining - 1

    await directus.request(
      updateItem('subscriptions', session.subscription, {
        postpone_remaining: newPostponeRemaining
      })
    )

    return {
      success: true,
      postpone_remaining: newPostponeRemaining
    }
  } catch (err: any) {
    console.error('[Approve Postpone] Error:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to approve postpone'
    })
  }
})

