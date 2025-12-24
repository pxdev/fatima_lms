/**
 * Approve Postpone Server Route
 * Approves a postpone request and decrements postpone counter
 */

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

    if (session.status !== 'student_requested_postpone') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session must be in postpone requested status'
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

    if (subscription.postpone_remaining <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No postpone credits remaining'
      })
    }

    // Update session status
    await $fetch(`${directusUrl}/items/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        status: 'postpone_approved',
        postpone_approved_at: new Date().toISOString()
      }
    })

    // Decrement postpone_remaining
    const newPostponeRemaining = subscription.postpone_remaining - 1

    await $fetch(`${directusUrl}/items/subscriptions/${session.subscription}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        postpone_remaining: newPostponeRemaining
      }
    })

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

