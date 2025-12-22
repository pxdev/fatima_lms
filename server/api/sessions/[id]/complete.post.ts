/**
 * Complete Session Server Route
 * Marks session as completed and decrements subscription counters
 */

import { createDirectus, rest, authentication, readItem, updateItem } from '@directus/sdk'

interface Session {
  id: string
  subscription: string
  status: string
}

interface Subscription {
  id: string
  sessions_remaining: number
  status: string
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

    if (session.status === 'completed') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session is already completed'
      })
    }

    if (!['scheduled', 'in_progress'].includes(session.status)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session cannot be completed in current status'
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

    // Update session status
    await directus.request(
      updateItem('sessions', sessionId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      })
    )

    // Decrement sessions_remaining
    const newSessionsRemaining = Math.max(0, subscription.sessions_remaining - 1)
    
    // Determine new subscription status
    let newSubscriptionStatus = subscription.status
    if (newSessionsRemaining === 0) {
      newSubscriptionStatus = 'completed'
    }

    await directus.request(
      updateItem('subscriptions', session.subscription, {
        sessions_remaining: newSessionsRemaining,
        ...(newSubscriptionStatus !== subscription.status && { status: newSubscriptionStatus })
      })
    )

    return {
      success: true,
      sessions_remaining: newSessionsRemaining,
      subscription_status: newSubscriptionStatus
    }
  } catch (err: any) {
    console.error('[Complete Session] Error:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to complete session'
    })
  }
})

