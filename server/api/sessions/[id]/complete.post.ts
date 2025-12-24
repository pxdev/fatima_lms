/**
 * Complete Session Server Route
 * Marks session as completed and decrements subscription counters
 */

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
    // Fetch the session
    const sessionResponse = await $fetch<{ data: Session }>(`${directusUrl}/items/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    })
    const session = sessionResponse.data

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
    const subResponse = await $fetch<{ data: Subscription }>(`${directusUrl}/items/subscriptions/${session.subscription}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    })
    const subscription = subResponse.data

    if (!subscription) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Subscription not found'
      })
    }

    // Update session status
    await $fetch(`${directusUrl}/items/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        status: 'completed',
        completed_at: new Date().toISOString()
      }
    })

    // Decrement sessions_remaining
    const newSessionsRemaining = Math.max(0, subscription.sessions_remaining - 1)
    
    // Determine new subscription status
    let newSubscriptionStatus = subscription.status
    if (newSessionsRemaining === 0) {
      newSubscriptionStatus = 'completed'
    }

    await $fetch(`${directusUrl}/items/subscriptions/${session.subscription}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        sessions_remaining: newSessionsRemaining,
        ...(newSubscriptionStatus !== subscription.status && { status: newSubscriptionStatus })
      }
    })

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

