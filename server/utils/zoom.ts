/**
 * Zoom API Integration
 * Server-only utilities for creating Zoom meetings
 */

interface ZoomTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface ZoomMeetingRequest {
  topic: string
  start_time: string // ISO 8601 format
  duration: number // minutes
  timezone?: string
}

interface ZoomMeetingResponse {
  id: number
  join_url: string
  start_url: string
  host_id: string
  topic: string
  start_time: string
  duration: number
}

let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Get Zoom access token using Server-to-Server OAuth
 */
export async function getZoomAccessToken(): Promise<string> {
  const config = useRuntimeConfig()
  
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  const { zoomAccountId, zoomClientId, zoomClientSecret } = config

  if (!zoomAccountId || !zoomClientId || !zoomClientSecret) {
    throw new Error('Zoom credentials not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET.')
  }

  const credentials = Buffer.from(`${zoomClientId}:${zoomClientSecret}`).toString('base64')

  const response = await $fetch<ZoomTokenResponse>('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'account_credentials',
      account_id: zoomAccountId
    }).toString()
  })

  // Cache the token (with 5 minute buffer)
  cachedToken = {
    token: response.access_token,
    expiresAt: Date.now() + (response.expires_in - 300) * 1000
  }

  return response.access_token
}

/**
 * Create a Zoom meeting
 */
export async function createZoomMeeting(meeting: ZoomMeetingRequest): Promise<ZoomMeetingResponse> {
  const token = await getZoomAccessToken()
  const config = useRuntimeConfig()

  // Use the Zoom user ID from config, or 'me' for the authenticated user
  const zoomUserId = config.zoomUserId || 'me'

  const response = await $fetch<ZoomMeetingResponse>(
    `https://api.zoom.us/v2/users/${zoomUserId}/meetings`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: {
        topic: meeting.topic,
        type: 2, // Scheduled meeting
        start_time: meeting.start_time,
        duration: meeting.duration,
        timezone: meeting.timezone || 'Asia/Riyadh',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          auto_recording: 'none'
        }
      }
    }
  )

  return response
}

/**
 * Delete a Zoom meeting
 */
export async function deleteZoomMeeting(meetingId: string | number): Promise<void> {
  const token = await getZoomAccessToken()

  await $fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
}





