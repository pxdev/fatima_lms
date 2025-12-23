/**
 * Sync Session Status
 * Auto-updates session status when end time has passed
 * Sessions that have ended but are still 'scheduled' or 'in_progress' 
 * will be marked as 'completed' (assuming they happened)
 */

import { createDirectus, rest, authentication, readItems, updateItem } from '@directus/sdk'

interface Session {
  id: string
  status: string
  end_at: string
  subscription: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

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
    // Get current time in local format (without Z) to match how sessions are stored
    const now = new Date()
    const localNow = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + 'T' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0')

    console.log('[Sync Session Status] Checking sessions ended before:', localNow)

    // Find sessions that have ended but still have active status
    const expiredSessions = await directus.request(
      readItems('sessions', {
        filter: {
          _and: [
            { end_at: { _lt: localNow } },
            { status: { _in: ['scheduled', 'in_progress'] } }
          ]
        },
        limit: 100
      })
    ) as Session[]

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
      directus.request(
        updateItem('sessions', session.id, {
          status: 'completed',
          completed_at: session.end_at // Mark completed at the scheduled end time
        })
      )
    )

    await Promise.all(updatePromises)

    return {
      success: true,
      updated: expiredSessions.length,
      message: `Updated ${expiredSessions.length} expired session(s) to completed`
    }
  } catch (err: any) {
    console.error('[Sync Session Status] Error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to sync session statuses'
    })
  }
})

