/**
 * Decline Week Server Route
 * Rejects a submitted week and sets status to rejected
 */

interface SubscriptionWeek {
  id: string
  subscription: string
  week_index: number
  status: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const subscriptionId = getRouterParam(event, 'id')
  const body = await readBody<{ week_id: string; reason?: string }>(event)

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
        statusMessage: 'Week must be in submitted status to decline'
      })
    }

    // Update week status to rejected
    await $fetch(`${directusUrl}/items/subscription_weeks/${body.week_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        status: 'rejected',
        reviewed_at: new Date().toISOString()
      }
    })

    return {
      success: true,
      status: 'rejected',
      week_id: body.week_id
    }
  } catch (err: any) {
    console.error('[Decline Week] Error:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to decline week'
    })
  }
})

