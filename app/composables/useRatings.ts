/**
 * Session Ratings Composable
 * Handles session rating operations
 */

interface SessionRating {
  id: string
  session: string
  rater: string
  rater_role: 'student' | 'teacher'
  rating: number // 1-5
  comment: string | null
}

interface CreateRatingPayload {
  session: string
  rater: string
  rater_role: 'student' | 'teacher'
  rating: number
  comment?: string | null
}

export function useRatings() {
  const { getItems, createItems } = useDirectusItems()

  const ratings = ref<SessionRating[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch ratings for a session
   */
  async function fetchSessionRatings(sessionId: string): Promise<SessionRating[]> {
    isLoading.value = true
    error.value = null

    try {
      const data = await getItems<SessionRating>({
        collection: 'session_ratings',
        params: {
          filter: {
            session: { _eq: sessionId }
          }
        }
      })

      ratings.value = data || []
      return ratings.value
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to fetch ratings'
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch ratings given by a user
   */
  async function fetchMyRatings(profileId: string): Promise<SessionRating[]> {
    isLoading.value = true
    error.value = null

    try {
      const data = await getItems<SessionRating>({
        collection: 'session_ratings',
        params: {
          filter: {
            rater: { _eq: profileId }
          },
          sort: ['-date_created']
        }
      })

      ratings.value = data || []
      return ratings.value
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to fetch ratings'
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a rating
   */
  async function createRating(payload: CreateRatingPayload): Promise<SessionRating | null> {
    isLoading.value = true
    error.value = null

    try {
      // Validate rating value
      if (payload.rating < 1 || payload.rating > 5) {
        throw new Error('Rating must be between 1 and 5')
      }

      const data = await createItems<SessionRating>({
        collection: 'session_ratings',
        items: [{
          session: payload.session,
          rater: payload.rater,
          rater_role: payload.rater_role,
          rating: payload.rating,
          comment: payload.comment || null
        }]
      })

      if (data && data.length > 0) {
        ratings.value.push(data[0])
        return data[0]
      }
      return null
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to create rating'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Check if user has already rated a session
   */
  async function hasRated(sessionId: string, profileId: string): Promise<boolean> {
    try {
      const data = await getItems<SessionRating>({
        collection: 'session_ratings',
        params: {
          filter: {
            _and: [
              { session: { _eq: sessionId } },
              { rater: { _eq: profileId } }
            ]
          },
          limit: 1
        }
      })

      return (data?.length || 0) > 0
    } catch {
      return false
    }
  }

  /**
   * Get average rating for sessions
   */
  function getAverageRating(): number {
    if (ratings.value.length === 0) return 0
    const sum = ratings.value.reduce((acc, r) => acc + r.rating, 0)
    return Math.round((sum / ratings.value.length) * 10) / 10
  }

  return {
    ratings,
    isLoading,
    error,
    fetchSessionRatings,
    fetchMyRatings,
    createRating,
    hasRated,
    getAverageRating
  }
}




