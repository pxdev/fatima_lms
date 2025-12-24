/**
 * Sync Session Status
 * Auto-updates session status when end time has passed
 * Sessions that have ended but are still 'scheduled' or 'in_progress' 
 * will be marked as 'completed' (assuming they happened)
 */

import { format } from 'date-fns'

interface Session {
  id: string
  status: string
  end_at: string
  subscription: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

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

  // Log configuration status (without exposing token)
  console.log('[Sync Session Status] Config check:', {
    hasDirectusUrl: !!directusUrl,
    hasAdminToken: !!adminToken,
    tokenLength: adminToken ? adminToken.length : 0,
    directusUrl: directusUrl,
    tokenPrefix: adminToken ? adminToken.substring(0, 10) + '...' : 'none'
  })

  if (!adminToken) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration error: Directus admin token missing. Please set NUXT_DIRECTUS_ADMIN_TOKEN environment variable and restart the server.'
    })
  }

  try {
    // Get current time in local format (without Z) to match how sessions are stored
    const now = new Date()
    const localNow = format(now, "yyyy-MM-dd'T'HH:mm:ss")

    console.log('[Sync Session Status] Checking sessions ended before:', localNow)

    // Find sessions that have ended but still have active status
    // Directus API requires filter to be JSON stringified in query params
    const filter = JSON.stringify({
      _and: [
        { end_at: { _lt: localNow } },
        { status: { _in: ['scheduled', 'in_progress'] } }
      ]
    })
    
    // Manually construct query string to ensure proper encoding
    const queryParams = new URLSearchParams({
      filter,
      limit: '100'
    })
    
    const apiUrl = `${directusUrl}/items/sessions?${queryParams.toString()}`
    console.log('[Sync Session Status] Calling Directus API:', apiUrl.replace(adminToken, '***'))
    
    const response = await $fetch<{ data: Session[] }>(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    })
    const expiredSessions = response.data || []

    console.log('[Sync Session Status] Found expired sessions:', expiredSessions.length)

    if (expiredSessions.length === 0) {
      return {
        success: true,
        updated: 0,
        message: 'No expired sessions to update'
      }
    }

    // Log what we're updating
    expiredSessions.forEach(s => {
      console.log(`[Sync Session Status] Updating session ${s.id}: end_at=${s.end_at}, status=${s.status}`)
    })

    // Update each expired session to 'completed'
    const updatePromises = expiredSessions.map(session =>
      $fetch(`${directusUrl}/items/sessions/${session.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: {
          status: 'completed',
          completed_at: session.end_at // Mark completed at the scheduled end time
        }
      })
    )

    await Promise.all(updatePromises)

    return {
      success: true,
      updated: expiredSessions.length,
      message: `Updated ${expiredSessions.length} expired session(s) to completed`
    }
  } catch (err: any) {
    console.error('[Sync Session Status] Error:', err)
    console.error('[Sync Session Status] Error details:', {
      message: err?.message,
      data: err?.data,
      status: err?.status,
      statusText: err?.statusText,
      response: err?.response
    })
    
    // Handle 401 Unauthorized specifically
    if (err?.status === 401 || err?.statusCode === 401) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid Directus admin token. Please verify that NUXT_DIRECTUS_ADMIN_TOKEN is set correctly and is a valid static token (not an access token). Static tokens can be created in Directus Settings > Access Tokens.'
      })
    }
    
    throw createError({
      statusCode: err?.statusCode || err?.status || 500,
      statusMessage: err?.data?.errors?.[0]?.message || err?.message || 'Failed to sync session statuses'
    })
  }
})

