import { ErrorCode } from '~~/server/utils/errors'

/**
 * POST /api/auth/create-profile
 * 
 * Creates a profile record in the `profiles` collection after user registration.
 * This is MANDATORY - every Directus user must have a corresponding profile.
 * 
 * Request body:
 * {
 *   "directus_user_id": "DIRECTUS_USER_UUID",
 *   "display_name": "User Name",
 *   "timezone": "Asia/Riyadh",
 *   "role": "student"
 * }
 * 
 * Response:
 * {
 *   "profile_id": "PROFILE_UUID"
 * }
 */

interface ProfilePayload {
  directus_user_id: string
  display_name: string
  timezone?: string
  role?: 'student' | 'teacher' | 'admin'
}

/**
 * Parse display_name into first_name and last_name
 */
function parseDisplayName(displayName: string): { first_name: string; last_name: string | null } {
  const parts = displayName.trim().split(/\s+/)
  return {
    first_name: parts[0] || displayName,
    last_name: parts.length > 1 ? parts.slice(1).join(' ') : null
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<ProfilePayload>(event)

  // ─────────────────────────────────────────────────────────
  // Validate required fields
  // ─────────────────────────────────────────────────────────
  if (!body.directus_user_id) {
    throw createError({
      statusCode: ErrorCode.BAD_REQUEST,
      statusMessage: 'directus_user_id is required'
    })
  }

  if (!body.display_name || body.display_name.trim().length < 2) {
    throw createError({
      statusCode: ErrorCode.BAD_REQUEST,
      statusMessage: 'display_name is required and must be at least 2 characters'
    })
  }

  // ─────────────────────────────────────────────────────────
  // Create Directus admin client for server-side operations
  // Uses admin token to create profile (user may not have permissions)
  // ─────────────────────────────────────────────────────────
  const directusUrl = config.public.directus.url
  const adminToken = config.directusAdminToken // Server-only admin token

  if (!adminToken) {
    console.error('DIRECTUS_ADMIN_TOKEN not configured')
    throw createError({
      statusCode: ErrorCode.INTERNAL_SERVER_ERROR,
      statusMessage: 'Server configuration error'
    })
  }

  if (!directusUrl) {
    throw createError({
      statusCode: ErrorCode.INTERNAL_SERVER_ERROR,
      statusMessage: 'Server configuration error: Directus URL missing'
    })
  }

  try {
    // ─────────────────────────────────────────────────────────
    // Check if profile already exists for this user
    // ─────────────────────────────────────────────────────────
    // Directus API requires filter to be JSON stringified in query params
    const filter = JSON.stringify({
      user: { _eq: body.directus_user_id }
    })
    
    const profilesResponse = await $fetch<{ data: { id: string }[] }>(`${directusUrl}/items/profiles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      params: {
        filter,
        limit: 1,
        fields: ['id']
      }
    })
    const existingProfiles = profilesResponse.data || []

    if (existingProfiles && existingProfiles.length > 0) {
      // Profile already exists, return existing ID
      return {
        profile_id: existingProfiles[0].id
      }
    }

    // ─────────────────────────────────────────────────────────
    // Update Directus user with first_name and last_name
    // ─────────────────────────────────────────────────────────
    const { first_name, last_name } = parseDisplayName(body.display_name)
    
    try {
      await $fetch(`${directusUrl}/users/${body.directus_user_id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: {
          first_name,
          last_name
        }
      })
    } catch (updateError) {
      // Log but don't fail - profile creation is more important
      console.warn('Failed to update user names:', updateError)
    }

    // ─────────────────────────────────────────────────────────
    // Create the profile record
    // ─────────────────────────────────────────────────────────
    const profileResponse = await $fetch<{ data: { id: string } }>(`${directusUrl}/items/profiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        user: body.directus_user_id,
        display_name: body.display_name.trim(),
        timezone: body.timezone || 'Asia/Riyadh',
        role: body.role || 'student',
        is_active: true
      }
    })
    const profile = profileResponse.data

    return {
      profile_id: profile.id
    }
  } catch (error: any) {
    // Handle Directus-specific errors
    if (error.errors) {
      const directusError = error.errors[0]
      console.error('Directus error creating profile:', directusError)
      throw createError({
        statusCode: directusError.extensions?.code === 'FORBIDDEN' 
          ? ErrorCode.FORBIDDEN 
          : ErrorCode.BAD_REQUEST,
        statusMessage: directusError.message || 'Failed to create profile'
      })
    }

    // Re-throw if it's already an H3 error
    if (error.statusCode) {
      throw error
    }

    console.error('Profile creation error:', error)
    throw createError({
      statusCode: ErrorCode.INTERNAL_SERVER_ERROR,
      statusMessage: 'An unexpected error occurred while creating your profile'
    })
  }
})
