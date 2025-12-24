/**
 * Create Teacher Availability Rule
 * Creates a new availability rule with duplicate validation
 */

interface AvailabilityRule {
  id: string
  teacher: string
  weekday: number
  start_time: string
  end_time: string
  is_active: boolean
}

interface CreateRuleBody {
  teacher: string
  weekday: number
  start_time: string
  end_time: string
  is_active?: boolean
}

function normalizeTime(time: string): string {
  return time.substring(0, 5)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<CreateRuleBody>(event)

  // Validate required fields
  if (!body.teacher || body.weekday === undefined || !body.start_time || !body.end_time) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: teacher, weekday, start_time, end_time'
    })
  }

  // Validate weekday range
  if (body.weekday < 0 || body.weekday > 6) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Weekday must be between 0 (Sunday) and 6 (Saturday)'
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
    // Check for existing duplicate rules
    // Directus API requires filter to be JSON stringified in query params
    const filter = JSON.stringify({
      teacher: { _eq: body.teacher },
      weekday: { _eq: body.weekday }
    })
    
    const rulesResponse = await $fetch<{ data: AvailabilityRule[] }>(`${directusUrl}/items/teacher_availability_rules`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      params: {
        filter
      }
    })
    const existingRules = rulesResponse.data || []

    // Check if any existing rule has the same normalized times
    const normalizedStart = normalizeTime(body.start_time)
    const normalizedEnd = normalizeTime(body.end_time)

    const duplicate = existingRules.find(rule => 
      normalizeTime(rule.start_time) === normalizedStart &&
      normalizeTime(rule.end_time) === normalizedEnd
    )

    if (duplicate) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A time slot with the same day and times already exists'
      })
    }

    // Create the new rule
    const createResponse = await $fetch<{ data: AvailabilityRule }>(`${directusUrl}/items/teacher_availability_rules`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        teacher: body.teacher,
        weekday: body.weekday,
        start_time: body.start_time,
        end_time: body.end_time,
        is_active: body.is_active ?? true
      }
    })
    const newRule = createResponse.data

    return {
      success: true,
      data: newRule
    }
  } catch (err: any) {
    console.error('[Create Availability Rule] Error:', err)
    
    // Re-throw if it's already a createError
    if (err.statusCode) {
      throw err
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create availability rule'
    })
  }
})

