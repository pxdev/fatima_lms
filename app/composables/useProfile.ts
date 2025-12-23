/**
 * Profile CRUD Composable
 * 
 * Handles fetching and updating the current user's profile.
 * Uses ONLY nuxt-directus composables (NO Directus SDK).
 */

interface Profile {
  id: string
  user: string
  role: 'student' | 'teacher' | 'admin'
  display_name: string
  phone: string | null
  timezone: string
  avatar: string | null
  bio: string | null
  languages: string | null
  is_active: boolean
}

interface ProfileUpdatePayload {
  display_name?: string
  phone?: string | null
  timezone?: string
  avatar?: string | null
  bio?: string | null
  languages?: string | null
}

export function useProfile() {
  const { getItems, updateItem } = useDirectusItems()
  const user = useDirectusUser()

  // Use useState to create a global shared state for profile
  const profile = useState<Profile | null>('user-profile', () => null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch the current user's profile
   */
  async function fetchProfile(): Promise<Profile | null> {
    const { checkAutoRefresh } = useDirectusToken()
    
    // Auto-refresh token if needed
    await checkAutoRefresh()

    if (!user.value?.id) {
      error.value = 'User not authenticated'
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      const profiles = await getItems<Profile>({
        collection: 'profiles',
        params: {
          filter: {
            user: { _eq: user.value.id }
          },
          limit: 1
        }
      })

      if (profiles && profiles.length > 0) {
        profile.value = profiles[0] as Profile
        return profiles[0] as Profile
      }

      error.value = 'Profile not found'
      return null
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to fetch profile'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update the current user's profile
   */
  async function updateProfileData(data: ProfileUpdatePayload): Promise<Profile | null> {
    if (!profile.value?.id) {
      error.value = 'No profile loaded'
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      const payload: Record<string, any> = {}
      
      if (data.display_name !== undefined) payload.display_name = data.display_name
      if (data.phone !== undefined) payload.phone = data.phone || null
      if (data.timezone !== undefined) payload.timezone = data.timezone
      if (data.avatar !== undefined) payload.avatar = data.avatar
      if (data.bio !== undefined) payload.bio = data.bio || null
      if (data.languages !== undefined) payload.languages = data.languages

      const updated = await updateItem<Profile>({
        collection: 'profiles',
        id: profile.value.id,
        item: payload
      })
      
      if (updated) {
        profile.value = updated
      } else {
        profile.value = { ...profile.value, ...payload } as Profile
      }
      
      return profile.value
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to update profile'
      return null
    } finally {
      isLoading.value = false
    }
  }

  const isTeacher = computed(() => profile.value?.role === 'teacher')
  const isAdmin = computed(() => profile.value?.role === 'admin')
  const isStudent = computed(() => profile.value?.role === 'student')

  return {
    profile,
    isLoading,
    error,
    isTeacher,
    isAdmin,
    isStudent,
    fetchProfile,
    updateProfile: updateProfileData
  }
}
